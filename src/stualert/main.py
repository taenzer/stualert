import os
import dotenv


def main():
    print("Hallo, Welt2!")
    print(os.environ.get("MY_ENV_VAR", "Umgebungsvariable nicht gesetzt"))

def dev():
    dotenv.load_dotenv()
    main()

if __name__ == "__main__":
    main()