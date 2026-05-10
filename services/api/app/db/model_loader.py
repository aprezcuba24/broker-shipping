from app.modules import get_app_modules


def load_module_models() -> None:
    """Import and register all SQLModel tables declared by ``AppModule.get_models``."""
    for module in get_app_modules():
        module.get_models()
