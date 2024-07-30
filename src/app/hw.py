from .config import app_config

if app_config.is_rpizero:

    from gpiozero import LED as GPIOpin  # type: ignore

else:

    class GPIOpin:
        def __init__(self, pin: int) -> None:
            self.pin: int = pin
            self.state: bool = False

        def on(self) -> None:
            self.state = True
            print(f"Output number {self.pin} set to ON")

        def off(self) -> None:
            self.state = False
            print(f"Output number {self.pin} set to OFF")


class HardwarePin:

    def __init__(self, pin: int, swapped: bool) -> None:
        """swap is needed for example when a relay turns the load off on high input"""

        self.swapped: bool = swapped
        self.gpio: GPIOpin = GPIOpin(pin)

    def turn_on(self) -> None:
        self.gpio.off() if (self.swapped and app_config.is_rpizero) else self.gpio.on()

    def turn_off(self) -> None:
        self.gpio.on() if (self.swapped and app_config.is_rpizero) else self.gpio.off()
