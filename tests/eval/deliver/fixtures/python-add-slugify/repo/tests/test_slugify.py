from src.slugify import slugify


def test_slugify_basic():
    assert slugify("Hello World") == "hello-world"
    assert slugify("  A  B  ") == "a-b"
