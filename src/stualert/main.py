import dotenv
from .mower.auth import HusqvarnaAuth

async def main():
    print("Hallo, Welt2!")
    auth = HusqvarnaAuth()
    token = await auth.get_token()
    print(f"Access Token: {token}")
async def dev():
    dotenv.load_dotenv()
    await main()

if __name__ == "__main__":
    main()