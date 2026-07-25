from fastapi import FastAPI

app = FastAPI(title="Broker API")


@app.get("/")
def hello() -> dict[str, str]:
    return {"message": "Hola mundo"}
