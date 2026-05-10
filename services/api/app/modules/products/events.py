from app.lib.event_base import Event


class ProductsModuleRootAccessed(Event):
    source: str
