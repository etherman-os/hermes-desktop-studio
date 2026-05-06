"""Custom messages for Hermes Shell UI."""

from textual.message import Message


class PromptSubmitted(Message):
    """Posted when the user submits a prompt."""

    def __init__(self, prompt: str) -> None:
        self.prompt = prompt
        super().__init__()


class SessionSelected(Message):
    """Posted when a session is selected from the sidebar."""

    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__()


class ShellEventMessage(Message):
    """Posted for each SSE event from a shell run."""

    def __init__(self, event: dict) -> None:
        self.event = event
        super().__init__()
