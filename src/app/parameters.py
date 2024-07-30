import json
import threading
from threading import Lock
from typing import Literal, NamedTuple

from .config import AppConfig
from .hw import HardwarePin


class HardwareDevice(NamedTuple):
    pin: int
    description: str
    hw_pin: HardwarePin


class TimerDevice(NamedTuple):
    hw_device: HardwareDevice
    name: str


class TimerUISeparator(NamedTuple):
    pass


class Parameters:

    empty_timer: dict[
        Literal["TIMES"] | Literal["ALWAYS_ON"] | Literal["ALWAYS_OFF"],
        list[dict[str, str]] | bool,
    ] = {
        "TIMES": [],
        "ALWAYS_OFF": False,
        "ALWAYS_ON": False,
    }

    def load(self, app_cfg: AppConfig) -> None:
        self.app_cfg: AppConfig = app_cfg

        # devices parsing

        with open(self.app_cfg.devices_path, "r") as devices_file:
            devices_json: list[
                dict[
                    Literal["IDX"] | Literal["PIN"] | Literal["DESCRIPTION"], int | str
                ]
            ] = json.load(devices_file)

        self.devices: dict[int, HardwareDevice] = {}

        for device in devices_json:
            current_idx: int = int(device["IDX"])
            current_pin: int = int(device["PIN"])
            current_desc: str = str(device["DESCRIPTION"])

            if current_idx not in list(self.devices.keys()):
                new_pin: HardwarePin = HardwarePin(
                    current_pin, self.app_cfg.swap_outputs
                )
                new_pin.turn_off()

                self.devices[current_idx] = HardwareDevice(
                    current_pin, current_desc, new_pin
                )

        # timers parsing

        with open(self.app_cfg.timers_path, "r") as timers_file:
            timers_json: list[
                dict[Literal["DEVICE_IDX"] | Literal["NAME"], int | str] | dict
            ] = json.load(timers_file)

        self.timers: list[TimerDevice | TimerUISeparator] = []

        for timer in timers_json:
            if not timer:
                self.timers.append(TimerUISeparator())
            else:
                dev_idx: int = int(timer["DEVICE_IDX"])
                name: str = str(timer["NAME"])

                self.timers.append(TimerDevice(self.devices[dev_idx], name))

        # settings settage

        # thread lock to be extra safe to avoid conflicts with the server thread
        self.settings_lock: Lock = threading.Lock()
        self.settings: list[
            dict[
                Literal["TIMES"] | Literal["ALWAYS_ON"] | Literal["ALWAYS_OFF"],
                list[dict[str, str]] | bool,
            ]
        ] = []
        self.settings_synced = False  # will automatically sync on get

    def write_settings_file(self) -> None:
        with open(self.app_cfg.settings_path, "w") as settings_file:
            json.dump(self.settings, settings_file, indent=4)

        self.settings_synced = True

    def reset_settings(self) -> None:
        self.settings = []

        for timer in self.timers:
            if not isinstance(timer, TimerUISeparator):
                self.settings.append(self.empty_timer)

    def get_settings(self) -> list[
        dict[  # yeah i should update to python 12 with type aliases
            Literal["TIMES"] | Literal["ALWAYS_ON"] | Literal["ALWAYS_OFF"],
            list[dict[str, str]] | bool,
        ]
    ]:
        with self.settings_lock:
            if not self.settings_synced:
                try:
                    with open(self.app_cfg.settings_path, "r") as settings_file:
                        self.settings = json.load(settings_file)

                    len_diff: int = len(self.settings) - sum(
                        1 for x in self.timers if isinstance(x, TimerDevice)
                    )
                    if len_diff < 0:
                        for _ in range(-len_diff):
                            self.settings.append(self.empty_timer)

                        self.write_settings_file()

                    self.settings_synced = True

                except:
                    self.reset_settings()
                    self.write_settings_file()

            return self.settings.copy()

    def set_settings(
        self,
        new_settings: list[
            dict[
                Literal["TIMES"] | Literal["ALWAYS_ON"] | Literal["ALWAYS_OFF"],
                list[dict[str, str]] | bool,
            ]
        ],
    ) -> None:
        with self.settings_lock:
            self.settings = new_settings
            self.settings_synced = False

            self.write_settings_file()


parameters: Parameters = Parameters()
