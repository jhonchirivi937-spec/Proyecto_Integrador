import random

def juego_adivinanza():
    numero_secreto = random.randint(1, 100)
    intentos = 0
    print("🤖 ¡Hola! He pensado un número entre 1 y 100.")

    while True:
        entrada = input("Introduce tu número: ")

        # Validar que sea un número entero
        if not entrada.isdigit():
            print("❌ Por favor, ingresa un número entero válido.")
            continue

        intento = int(entrada)
        intentos += 1

        if intento < numero_secreto:
            print("📈 Es MAYOR. Intenta de nuevo.")
        elif intento > numero_secreto:
            print("📉 Es MENOR. Intenta de nuevo.")
        else:
            print(f"🎉 ¡Correcto! Adivinaste el número {numero_secreto} en {intentos} intentos.")
            break

if __name__ == "__main__":
    juego_adivinanza()