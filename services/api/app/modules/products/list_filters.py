from app.lib.persistence import FilterFieldConfig, FilterOperator, FilterSpec
from app.modules.products.models import Product

PRODUCT_LIST_FILTER_SPEC = FilterSpec(
    model=Product,
    fields={
        "category_id": FilterFieldConfig(operator=FilterOperator.eq),
        "name": FilterFieldConfig(operator=FilterOperator.ilike),
    },
)

ProductListFilters = PRODUCT_LIST_FILTER_SPEC.as_params_model()
product_list_filters = PRODUCT_LIST_FILTER_SPEC.as_dependency()
