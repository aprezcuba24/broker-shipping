from app.models import get_all_table_models


def load_all_table_models() -> None:
    """Import and register all SQLModel tables declared by domain packages."""
    get_all_table_models()
