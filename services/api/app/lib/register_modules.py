from fastapi import FastAPI

from app.lib.app_module import AppModule
from app.lib.event_dispatcher import EventDispatcher


def register_modules(
    app: FastAPI,
    app_modules: tuple[AppModule, ...],
    dispatcher: EventDispatcher,
) -> None:
    for module in app_modules:
        module.get_listener_registrar()(dispatcher)
        tag = module.prefix.strip("/").replace("-", "_") or "module"
        app.include_router(module.get_router(), prefix=module.prefix, tags=[tag])
