import json
import pathlib
from datetime import datetime
from pathlib import Path
from typing import Literal

import werkzeug.exceptions
from flask import Flask, jsonify, redirect, render_template, request

from app import (HardwareDevice, TimerDevice, TimerUISeparator, app_config,
                 app_timers, init_hw, parameters, translations)

app = Flask(__name__)


@app.errorhandler(werkzeug.exceptions.NotFound)
def error_not_found(_):
    return redirect("/timer-settings")


@app.route("/")
def site_root():
    return redirect("/timer-settings")


@app.route("/timer-settings")
def index():
    return render_template("index.html", locale=translations.get(app_config.locale))


@app.route("/config/timers", methods=["GET"])
def get_timers():
    timers: list[TimerDevice | TimerUISeparator] = parameters.timers
    timers_settings: list[
        dict[Literal["TIMES", "ALWAYS_ON", "ALWAYS_OFF"], list[dict[str, str]] | bool]
    ] = parameters.get_settings()
    timers_state = app_timers.get_timers_state()

    request_list: list[
        dict[
            Literal["SETTING_IDX"]
            | Literal["NAME"]
            | Literal["TIMES"]
            | Literal["ACTIVE_TIMER"]
            | Literal["ALWAYS_ON"]
            | Literal["ALWAYS_OFF"],
            int | str | list | bool,
        ]
    ] = []

    timer_idx: int = 0
    for timer in timers:
        if isinstance(timer, TimerUISeparator):
            request_list.append({})
            continue

        current_setting = timers_settings[timer_idx]
        current_timers_state = timers_state.get(timer_idx, -1)
        if current_timers_state == None:
            current_timers_state = -1

        assert isinstance(current_setting["TIMES"], list)
        assert isinstance(current_setting["ALWAYS_ON"], bool)
        assert isinstance(current_setting["ALWAYS_OFF"], bool)

        request_list.append(
            {
                "SETTING_IDX": timer_idx,
                "NAME": timer.name,
                "TIMES": current_setting["TIMES"],
                "ACTIVE_TIMER": current_timers_state,
                "ALWAYS_ON": current_setting["ALWAYS_ON"],
                "ALWAYS_OFF": current_setting["ALWAYS_OFF"],
            }
        )

        timer_idx += 1

    return jsonify(request_list)


# this one is not used by the app itself
# its just here to provide a way to manually check the devices
@app.route("/config/devices", methods=["GET"])
def get_devices():
    devices: dict[int, HardwareDevice] = parameters.devices

    request_devices: list[
        dict[Literal["IDX"] | Literal["PIN"] | Literal["DESCRIPTION"], int | str]
    ] = []

    for device_idx, hw_device in devices.items():
        request_devices.append(
            {
                "IDX": device_idx,
                "PIN": hw_device.pin,
                "DESCRIPTION": hw_device.description,
            }
        )

    return jsonify(request_devices)


@app.route("/set-always-state", methods=["POST"])
def set_always_state():
    if request.is_json:
        try:
            data: dict[
                Literal["SETTING_IDX"] | Literal["ALWAYS_ON"] | Literal["ALWAYS_OFF"],
                int | bool,
            ] = request.get_json()

            timers_settings: list[
                dict[
                    Literal["TIMES", "ALWAYS_ON", "ALWAYS_OFF"],
                    list[dict[str, str]] | bool,
                ]
            ] = parameters.get_settings()

            this_setting = timers_settings[data["SETTING_IDX"]]

            this_setting["ALWAYS_OFF"] = bool(
                data.get("ALWAYS_OFF", this_setting["ALWAYS_OFF"])
            )
            this_setting["ALWAYS_ON"] = bool(
                data.get("ALWAYS_ON", this_setting["ALWAYS_ON"])
            )

            parameters.set_settings(timers_settings)

        except json.JSONDecodeError:
            return jsonify(False)
    else:
        return jsonify(False)

    return jsonify(True)


@app.route("/set-timer-times", methods=["POST"])
def set_timer_times():
    if request.is_json:
        try:
            data: dict[Literal["SETTING_IDX"] | Literal["TIMES"], int | list] = (
                request.get_json()
            )

            assert isinstance(data["SETTING_IDX"], int)
            assert isinstance(data["TIMES"], list)

            timers_settings: list[
                dict[
                    Literal["TIMES", "ALWAYS_ON", "ALWAYS_OFF"],
                    list[dict[str, str]] | bool,
                ]
            ] = parameters.get_settings()

            this_setting = timers_settings[data["SETTING_IDX"]]

            data["TIMES"] = sorted(
                data["TIMES"], key=lambda x: datetime.strptime(x["START"], "%H:%M")
            )

            this_setting["TIMES"] = data["TIMES"]

            parameters.set_settings(timers_settings)

        except json.JSONDecodeError:
            return jsonify(False)
    else:
        return jsonify(False)

    return jsonify(True)


if __name__ == "__main__":
    main_folder: Path = pathlib.Path(__file__).parent.resolve()
    app_config.load(main_folder)
    init_hw()
    translations.load(app_config)
    parameters.load(app_config)
    app_timers.init(parameters)

    parameters.on_update = app_timers.force_update

    print("loaded application")

    app_timers.start()
    app.run(host=app_config.app_host)
    app_timers.end()

    print("application closed")
