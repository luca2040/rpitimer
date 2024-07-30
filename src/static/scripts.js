let timers_json_data = null;

// MODAL WINDOW

let modal_global = null;
let close_modal_button = null;
let add_time_button = null;
let confirm_changes_button = null;
let modal_time_list = null;

// TIME LIST

let times_list_to_edit = [];

document.addEventListener('DOMContentLoaded', () => {
    modal_global = document.getElementById('edit-modal');

    close_modal_button = document.querySelector('.close');
    close_modal_button.onclick = () => {
        modal_global.style.display = 'none';
    };
    window.onclick = function (event) {
        if (event.target === modal_global) {
            modal_global.style.display = 'none';
        }
    };

    add_time_button = document.getElementById('add-time');
    confirm_changes_button = document.getElementById('confirm-changes');
    modal_time_list = document.getElementById('time-list');

    fetch_timers_json_data();

    add_time_button.onclick = () => {
        const new_timer_inner_slot = document.createElement('div');

        new_timer_inner_slot.className = "time-slot";

        const start_time_input_field = document.createElement("input");
        const separator_time_input = document.createElement("span");
        const end_time_input_field = document.createElement("input");
        const remove_time_button = document.createElement("button");

        start_time_input_field.type = "time";
        start_time_input_field.placeholder = "Start";
        end_time_input_field.type = "time";
        end_time_input_field.placeholder = "End";

        times_list_to_edit.push([start_time_input_field, end_time_input_field]);

        separator_time_input.className = "separator";
        separator_time_input.innerHTML = "—";

        remove_time_button.className = "btn-remove";
        remove_time_button.innerHTML = "Rimuovi";

        new_timer_inner_slot.appendChild(start_time_input_field);
        new_timer_inner_slot.appendChild(separator_time_input);
        new_timer_inner_slot.appendChild(end_time_input_field);
        new_timer_inner_slot.appendChild(remove_time_button);

        const single_remove_button = new_timer_inner_slot.querySelector('.btn-remove');
        single_remove_button.onclick = () => {
            new_timer_inner_slot.remove();

            const index = times_list_to_edit.findIndex(tuple => tuple[0] === start_time_input_field && tuple[1] === end_time_input_field);

            if (index !== -1) {
                times_list_to_edit.splice(index, 1);
            }

        };

        modal_time_list.appendChild(new_timer_inner_slot);
    };
});

async function set_always_state_request(data) {
    try {
        const response = await fetch('/set-always-state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const responseData = await response.text();

        return responseData;

    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

async function set_timer_times_at_index(rel_idx, json_array_data) {
    try {
        const response = await fetch('/set-timer-times', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                SETTING_IDX: rel_idx,
                TIMES: json_array_data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const responseData = await response.text();

        return responseData;

    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

async function fetch_timers_json_data() {
    try {
        const response_timers = await fetch('/config/timers');

        if (!response_timers.ok) {
            throw new Error('Network response_timers was not ok');
        }

        timers_json_data = await response_timers.json();

        const container = document.getElementById("timers-box-group");
        container.innerHTML = "";

        for (const timer of timers_json_data) {

            const container_box = document.createElement("div");
            container_box.className = "box";

            console.log(timer)

            // elements without setting index are separators
            if (!("SETTING_IDX" in timer)) {

                container_box.className = "separator-box";

            } else {
                // HEADER

                const header_title = document.createElement("div");
                header_title.className = "box-header";
                header_title.innerHTML = "<h2>" + timer.NAME + "</h2>";
                container_box.appendChild(header_title);

                // TIMERS

                const timers_internal_container = document.createElement("div");
                timers_internal_container.className = "timers";

                // SINGLE TIMERS

                for (const single_time of timer.TIMES) {

                    const single_timer = document.createElement("div");
                    single_timer.className = "timer";

                    // LABELS
                    const time_start_label = document.createElement("span");
                    const time_start_time = document.createElement("span");
                    const time_label_separator = document.createElement("span");
                    const time_end_label = document.createElement("span");
                    const time_end_time = document.createElement("span");

                    time_start_label.className = "timer-label";
                    time_start_label.innerHTML = "Inizio:";
                    time_end_label.className = "timer-label";
                    time_end_label.innerHTML = "Fine:";

                    time_label_separator.className = "separator";
                    time_label_separator.innerHTML = "—";

                    time_start_time.className = "timer-time";
                    time_end_time.className = "timer-time";

                    // TIMES

                    time_start_time.innerHTML = single_time.START;
                    time_end_time.innerHTML = single_time.END;

                    single_timer.appendChild(time_start_label);
                    single_timer.appendChild(time_start_time);
                    single_timer.appendChild(time_label_separator);
                    single_timer.appendChild(time_end_label);
                    single_timer.appendChild(time_end_time);

                    timers_internal_container.appendChild(single_timer);

                }

                container_box.appendChild(timers_internal_container);

                const controls_container_box = document.createElement("div");
                controls_container_box.className = "controls";

                // MODIFICA TEMPI

                const button_edit_times = document.createElement("button");
                button_edit_times.className = "btn-edit";
                button_edit_times.innerHTML = "Modifica tempi";

                button_edit_times.onclick = () => {
                    modal_time_list.innerHTML = "";
                    times_list_to_edit = [];

                    for (const single_time of timer.TIMES) {

                        const new_timer_inner_slot = document.createElement('div');

                        new_timer_inner_slot.className = "time-slot";

                        const start_time_input_field = document.createElement("input");
                        const separator_time_input = document.createElement("span");
                        const end_time_input_field = document.createElement("input");
                        const remove_time_button = document.createElement("button");

                        start_time_input_field.type = "time";
                        start_time_input_field.placeholder = "Start";
                        start_time_input_field.value = single_time.START;
                        end_time_input_field.type = "time";
                        end_time_input_field.placeholder = "End";
                        end_time_input_field.value = single_time.END;

                        times_list_to_edit.push([start_time_input_field, end_time_input_field]);

                        separator_time_input.className = "separator";
                        separator_time_input.innerHTML = "—";

                        remove_time_button.className = "btn-remove";
                        remove_time_button.innerHTML = "Rimuovi";

                        new_timer_inner_slot.appendChild(start_time_input_field);
                        new_timer_inner_slot.appendChild(separator_time_input);
                        new_timer_inner_slot.appendChild(end_time_input_field);
                        new_timer_inner_slot.appendChild(remove_time_button);

                        const single_remove_button = new_timer_inner_slot.querySelector('.btn-remove');
                        single_remove_button.onclick = () => {
                            new_timer_inner_slot.remove();

                            const index = times_list_to_edit.findIndex(tuple => tuple[0] === start_time_input_field && tuple[1] === end_time_input_field);

                            if (index !== -1) {
                                times_list_to_edit.splice(index, 1);
                            }

                        };

                        modal_time_list.appendChild(new_timer_inner_slot);

                    }

                    confirm_changes_button.onclick = () => {

                        let elementEmpty = false;

                        for (single_tuple of times_list_to_edit) {
                            if ((single_tuple[0].value === "") || (single_tuple[1].value === "")) {
                                elementEmpty = true;
                                alert("Selezionare un orario per ogni tempo.");
                                break;
                            }
                        }

                        if (!elementEmpty) {

                            json_array = [];

                            for (single_tuple of times_list_to_edit) {
                                json_array.push({
                                    "START": single_tuple[0].value,
                                    "END": single_tuple[1].value
                                })
                            }

                            (async () => {
                                await set_timer_times_at_index(timer.SETTING_IDX, json_array);

                                modal_global.style.display = 'none';

                                fetch_timers_json_data();
                            })();
                        }
                    };

                    modal_global.style.display = 'flex';
                };

                controls_container_box.appendChild(button_edit_times);

                const toggle_buttons_container = document.createElement("div");
                toggle_buttons_container.className = "toggle-buttons";

                const button_toggle_on = document.createElement("button");
                const button_toggle_off = document.createElement("button");

                button_toggle_on.className = "btn-toggle btn-on";
                button_toggle_off.className = "btn-toggle btn-off";

                // Set current state

                if (timer.ALWAYS_ON)
                    button_toggle_on.classList.add("active");
                else if (timer.ALWAYS_OFF)
                    button_toggle_off.classList.add("active");

                button_toggle_on.innerHTML = "Sempre acceso";
                button_toggle_off.innerHTML = "Sempre spento";

                // BUTTON ON EVENTS
                button_toggle_on.onclick = () => {
                    if (button_toggle_on.classList.contains('active')) {
                        button_toggle_on.classList.remove('active');

                        (async () => {
                            await set_always_state_request({
                                SETTING_IDX: timer.SETTING_IDX,
                                ALWAYS_OFF: false,
                                ALWAYS_ON: false
                            });
                        })();

                    } else {
                        button_toggle_on.classList.add('active');
                        button_toggle_off.classList.remove('active');

                        (async () => {
                            await set_always_state_request({
                                SETTING_IDX: timer.SETTING_IDX,
                                ALWAYS_OFF: false,
                                ALWAYS_ON: true
                            });
                        })();
                    }
                };
                // BUTTON OFF EVENTS
                button_toggle_off.onclick = () => {
                    if (button_toggle_off.classList.contains('active')) {
                        button_toggle_off.classList.remove('active');

                        (async () => {
                            await set_always_state_request({
                                SETTING_IDX: timer.SETTING_IDX,
                                ALWAYS_OFF: false,
                                ALWAYS_ON: false
                            });
                        })();

                    } else {
                        button_toggle_off.classList.add('active');
                        button_toggle_on.classList.remove('active');

                        (async () => {
                            await set_always_state_request({
                                SETTING_IDX: timer.SETTING_IDX,
                                ALWAYS_OFF: true,
                                ALWAYS_ON: false
                            });
                        })();
                    }
                };

                toggle_buttons_container.appendChild(button_toggle_on);
                toggle_buttons_container.appendChild(button_toggle_off);

                controls_container_box.appendChild(toggle_buttons_container);

                container_box.appendChild(controls_container_box);

            }

            container.appendChild(container_box);

        }

    } catch (error) {
        console.error('Request error:', error);
    }
}
