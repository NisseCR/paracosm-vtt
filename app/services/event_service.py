from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator


class EventService:
    """
    Broadcast server-sent events to connected clients.

    This is a lightweight in-process event bus, which is a good fit for a
    single-machine local application.
    """

    def __init__(self) -> None:
        self._queues: set[asyncio.Queue[str]] = set()

    async def connect(self) -> AsyncIterator[str]:
        """
        Register a client and yield events as they become available.

        Returns:
            An async iterator of SSE-ready event strings.
        """
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._queues.add(queue)

        try:
            while True:
                yield await queue.get()
        finally:
            self._queues.discard(queue)

    def format_event(self, event_type: str, payload: dict) -> str:
        """
        Format an SSE message.

        Args:
            event_type: The event name.
            payload: The event payload.

        Returns:
            A properly formatted SSE message string.
        """
        return f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"

    async def broadcast(self, event_type: str, payload: dict) -> None:
        """
        Send an event to all currently connected clients.

        Args:
            event_type: The event name.
            payload: The event payload.
        """
        message = self.format_event(event_type, payload)

        for queue in list(self._queues):
            await queue.put(message)