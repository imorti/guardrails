from __future__ import annotations

import os
import re
from collections.abc import Sequence
from typing import Final, TypedDict

from dotenv import load_dotenv


load_dotenv()

REDACTION_LABEL: Final = "[REDACTED INFORMATION]"
UNVERIFIED_RESPONSE: Final = (
    "Error: The system generated a response that could not be verified "
    "by internal corporate documentation."
)

JAILBREAK_PATTERNS: Final = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"ignore\s+previous\s+instructions",
        r"ignore\s+all\s+guidelines",
        r"system\s+prompt\s+override",
        r"you\s+are\s+now\s+an\s+unconstrained",
        r"act\s+as\s+a\s+terminal\s+with\s+no\s+rules",
    )
)
BLOCKED_KEYWORDS: Final = (
    "master password",
    "root credentials",
    "database connection string",
)
SENSITIVE_PATTERNS: Final = (
    re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b", re.IGNORECASE),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
)
FACT_CHECK_TERMS: Final = frozenset(
    {"salary", "ninety", "thousand", "credentials", "grpc"}
)
ROLE_DEPARTMENT_ACCESS: Final = {
    "Engineering": frozenset({"Engineering"}),
    "Human Resources": frozenset({"Engineering", "Human Resources"}),
}
QUERY_STOP_WORDS: Final = frozenset(
    {"about", "details", "employee", "from", "into", "please", "show", "that", "the"}
)


class GuardrailResult(TypedDict):
    is_safe: bool
    reason: str


class Document(TypedDict):
    id: str
    department: str
    content: str


DEFAULT_DOCUMENTS: Final[tuple[Document, ...]] = (
    {
        "id": "doc_1",
        "department": "Engineering",
        "content": (
            "The production deployment pipeline uses an isolated cluster "
            "topology. Updates run via GitHub Actions."
        ),
    },
    {
        "id": "doc_2",
        "department": "Human Resources",
        "content": (
            "Confidential salary structure: Senior engineers operate within "
            "tier four, ranging from ninety thousand to one hundred twenty "
            "thousand dollars."
        ),
    },
    {
        "id": "doc_3",
        "department": "Engineering",
        "content": (
            "The microservices communicate using internal gRPC protocols "
            "verified by mutual Transport Layer Security certificates."
        ),
    },
)


def get_environment() -> str:
    """Return the configured application environment."""
    return os.getenv("APP_ENV", "").strip() or "development"


def normalize_text(value: str) -> str:
    """Normalize case and whitespace for deterministic policy matching."""
    return " ".join(value.casefold().split())


def tokenize(value: str) -> set[str]:
    """Extract meaningful lowercase words for simple document matching."""
    words = set(re.findall(r"[a-z0-9]+", value.casefold()))
    return {word for word in words if len(word) > 2 and word not in QUERY_STOP_WORDS}


class InputGuardrail:
    """Detect explicit restricted keywords and known jailbreak phrases."""

    def check_explicit_jailbreak(self, user_prompt: str) -> bool:
        """Return whether a prompt contains an explicitly blocked pattern."""
        normalized_prompt = normalize_text(user_prompt)
        return any(
            keyword in normalized_prompt for keyword in BLOCKED_KEYWORDS
        ) or any(pattern.search(normalized_prompt) for pattern in JAILBREAK_PATTERNS)

    def validate_prompt(self, user_prompt: str) -> GuardrailResult:
        """Run all active checks on an incoming prompt."""
        if not isinstance(user_prompt, str):
            raise TypeError("user_prompt must be a string")

        if self.check_explicit_jailbreak(user_prompt):
            return {
                "is_safe": False,
                "reason": (
                    "Security policy violation: malicious input pattern or "
                    "restricted keyword detected."
                ),
            }

        return {
            "is_safe": True,
            "reason": "Prompt passed input security checks.",
        }


class DocumentRetrievalEngine:
    """Retrieve relevant documents after applying role-based access control."""

    def __init__(self, documents: Sequence[Document] = DEFAULT_DOCUMENTS) -> None:
        self._documents = tuple(documents)

    def retrieve_context(self, user_query: str, user_role: str) -> list[str]:
        """Return relevant content from departments available to the role."""
        if not isinstance(user_query, str) or not isinstance(user_role, str):
            raise TypeError("user_query and user_role must be strings")

        allowed_departments = ROLE_DEPARTMENT_ACCESS.get(user_role, frozenset())
        query_terms = tokenize(user_query)
        if not allowed_departments or not query_terms:
            return []

        return [
            document["content"]
            for document in self._documents
            if document["department"] in allowed_departments
            and query_terms.intersection(tokenize(document["content"]))
        ]


class OutputGuardrail:
    """Redact structured personal data and reject unsupported factual claims."""

    def redact_sensitive_data(self, model_response: str) -> str:
        """Replace supported sensitive-data formats with a redaction label."""
        clean_text = model_response
        for pattern in SENSITIVE_PATTERNS:
            clean_text = pattern.sub(REDACTION_LABEL, clean_text)
        return clean_text

    def verify_factuality(
        self,
        model_response: str,
        source_contexts: Sequence[str],
    ) -> bool:
        """Check selected factual terms against the approved source text."""
        if not source_contexts and len(model_response) > 50:
            return False

        response_terms = tokenize(model_response).intersection(FACT_CHECK_TERMS)
        source_terms = tokenize(" ".join(source_contexts))
        return response_terms.issubset(source_terms)

    def process_output(
        self,
        model_response: str,
        source_contexts: Sequence[str],
    ) -> str:
        """Sanitize and verify generated text before presenting it."""
        if not isinstance(model_response, str):
            raise TypeError("model_response must be a string")
        if isinstance(source_contexts, (str, bytes)):
            raise TypeError("source_contexts must be a sequence of strings")
        if not all(isinstance(context, str) for context in source_contexts):
            raise TypeError("source_contexts must contain only strings")

        sanitized_response = self.redact_sensitive_data(model_response)
        if not self.verify_factuality(sanitized_response, source_contexts):
            return UNVERIFIED_RESPONSE
        return sanitized_response


def main() -> None:
    """Run a small demonstration of the guardrail pipeline."""
    query = "Show me details about employee salary ranges"
    role = "Engineering"

    input_result = InputGuardrail().validate_prompt(query)
    contexts = DocumentRetrievalEngine().retrieve_context(query, role)
    draft_response = (
        contexts[0]
        if contexts
        else "No authorized matching documents were found."
    )
    output = OutputGuardrail().process_output(
        draft_response,
        contexts,
    )

    print(f"Application environment: {get_environment()}")
    print(f"Input accepted: {input_result['is_safe']}")
    print(f"Documents retrieved for role '{role}': {len(contexts)}")
    print(f"Final output: {output}")


if __name__ == "__main__":
    main()
