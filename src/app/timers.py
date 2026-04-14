import threading
from datetime import datetime
from threading import Event
from typing import Literal

from .config import AppConfig
from .parameters import Parameters, TimerDevice, TimerUISeparator


class Timers:

    def init(self, parameters: Parameters) -> None:
        self.params: Parameters = parameters
        self.app_cfg: AppConfig = parameters.app_cfg

        self.active: Event = threading.Event()
        self.update_flag: Event = threading.Event()

        self.active.clear()
        self.update_flag.clear()

    def timers_main(self) -> None:
        while self.active.is_set():
            try:
                self.timers_cycle()

            except Exception as e:
                print(str(e))

            self.update_flag.wait(timeout=self.app_cfg.cycle_delay)
            self.update_flag.clear()

    def timers_cycle(self):
        timers: list[TimerDevice | TimerUISeparator] = self.params.timers
        timers_settings: list[
            dict[
                Literal["TIMES", "ALWAYS_ON", "ALWAYS_OFF"], list[dict[str, str]] | bool
            ]
        ] = self.params.get_settings()

        timer_idx: int = 0
        for timer in timers:
            if isinstance(timer, TimerUISeparator):
                continue

            current_setting = timers_settings[timer_idx]
            current_pin = timer.hw_device.hw_pin

            timer_intervals = current_setting["TIMES"]
            assert isinstance(timer_intervals, list)

            now = datetime.now().time()

            is_always_off = current_setting["ALWAYS_OFF"]
            is_always_on = current_setting["ALWAYS_ON"]

            if is_always_off:
                current_pin.turn_off()
            elif is_always_on:
                current_pin.turn_on()
            else:
                for interval in timer_intervals:
                    start = datetime.strptime(interval["START"], "%H:%M").time()
                    end = datetime.strptime(interval["END"], "%H:%M").time()

                    if end < start:
                        if start <= now or now <= end:
                            current_pin.turn_on()
                            break

                    elif start <= now <= end:
                        current_pin.turn_on()
                        break
                else:
                    current_pin.turn_off()

            timer_idx += 1

    def force_update(self) -> None:
        self.update_flag.set()

    def start(self) -> None:
        self.active.set()

        self.timer_thread = threading.Thread(target=self.timers_main)
        self.timer_thread.start()

    def end(self) -> None:
        self.active.clear()
        self.update_flag.set()

        self.timer_thread.join()


app_timers: Timers = Timers()
