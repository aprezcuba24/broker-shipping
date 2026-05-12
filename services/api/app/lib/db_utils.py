from collections.abc import Callable
from typing import TypeVar

from app.lib.dependencies import EventDispatcherDep, PostCommitDep, SessionDep

S = TypeVar("S")


def make_service_depends(
    service_cls: type[S],
    repo_cls: type,
    *,
    with_events: bool = False,
) -> Callable[..., S]:
    """Return a FastAPI-compatible dependency that builds *repo_cls* then *service_cls*.

    Usage::

        _get_product_service = make_service_depends(
            ProductService, ProductRepository, with_events=True,
        )
        ProductServiceDep = Annotated[ProductService, Depends(_get_product_service)]

    The explicit ``Annotated[ProductService, ...]`` is what lets the IDE
    resolve the concrete class for autocompletion.

    When *with_events* is ``True`` the factory also injects
    ``EventDispatcher`` and ``PostCommitQueue`` and forwards them to the
    service constructor as *dispatcher* and *post_commit*.
    """
    if with_events:

        def _factory(
            session: SessionDep,
            dispatcher: EventDispatcherDep,
            post_commit: PostCommitDep,
        ) -> S:
            return service_cls(
                repository=repo_cls(session),
                dispatcher=dispatcher,
                post_commit=post_commit,
            )
    else:

        def _factory(session: SessionDep) -> S:
            return service_cls(repository=repo_cls(session))

    return _factory
