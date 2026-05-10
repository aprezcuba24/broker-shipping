from pydantic import BaseModel


class Event(BaseModel):
    """Base type for domain events; subclass with public fields for the payload."""
