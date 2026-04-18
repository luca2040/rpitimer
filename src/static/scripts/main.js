let ui_elements = {
    edit_window: null,
    close_edit_window: null,

    add_time_button: null,
    confirm_changes_button: null,
    window_time_list: null,

    container: null,

    edit_time_list: []
}

document.addEventListener('DOMContentLoaded', () => {
    ui_elements.edit_window = document.getElementById('edit-window');
    ui_elements.close_edit_window = document.getElementById('close-edit');

    ui_elements.add_time_button = document.getElementById('add-time');
    ui_elements.confirm_changes_button = document.getElementById('confirm-changes');
    ui_elements.window_time_list = document.getElementById('time-list');

    ui_elements.container = document.getElementById("timers-box-group");

    set_edit_window();
    ui_elements.add_time_button.onclick = add_new_timer;

    refresh_entire_timer_data();
});

function set_edit_window() {
    ui_elements.close_edit_window.onclick = () => {
        ui_elements.edit_window.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === ui_elements.edit_window) {
            ui_elements.edit_window.style.display = 'none';
        }
    };
}

function add_new_timer(start_time = null, end_time = null) {
    const new_timer_inner_slot = document.createElement('div');
    new_timer_inner_slot.className = "time-slot";

    const start_time_input_field = document.createElement("input");
    const separator_time_input = document.createElement("span");
    const end_time_input_field = document.createElement("input");
    const remove_time_button = document.createElement("button");

    start_time_input_field.type = "time";
    start_time_input_field.placeholder = TRANSLATIONS.time_field_placeholder_start;
    end_time_input_field.type = "time";
    end_time_input_field.placeholder = TRANSLATIONS.time_field_placeholder_end;

    if ((start_time != null) && (end_time != null)) {
        start_time_input_field.value = start_time;
        end_time_input_field.value = end_time;
    }

    const new_fields = {
        start: start_time_input_field,
        end: end_time_input_field
    };

    ui_elements.edit_time_list.push(new_fields);

    separator_time_input.className = "separator";
    separator_time_input.innerHTML = "—";

    remove_time_button.className = "btn-remove";
    remove_time_button.innerHTML = TRANSLATIONS.remove_button;
    remove_time_button.id = "remove-button";

    new_timer_inner_slot.appendChild(start_time_input_field);
    new_timer_inner_slot.appendChild(separator_time_input);
    new_timer_inner_slot.appendChild(end_time_input_field);
    new_timer_inner_slot.appendChild(remove_time_button);

    const single_remove_button = new_timer_inner_slot.querySelector('#remove-button');
    single_remove_button.onclick = () => {
        new_timer_inner_slot.remove();

        const index = ui_elements.edit_time_list.indexOf(new_fields);

        if (index !== -1) {
            ui_elements.edit_time_list.splice(index, 1);
        }
    };

    ui_elements.window_time_list.appendChild(new_timer_inner_slot);
}

function set_always_button(thiz, opposite, idx, is_on_button) {
    thiz.onclick = () => {
        let deactivated = false;
        if (thiz.classList.contains('active')) {
            thiz.classList.remove('active');
            deactivated = true;
        } else {
            thiz.classList.add('active');
            opposite.classList.remove('active');
        }

        (async () => {
            const expected_off = (!is_on_button) && (!deactivated);
            const expected_on = is_on_button && (!deactivated);

            await set_always_state_request(idx, expected_off, expected_on);

            let timers_json_data = await fetch_timer_config();
            for (const timer of timers_json_data) {
                if (!("SETTING_IDX" in timer))
                    continue;

                if (timer.SETTING_IDX == idx) {
                    if ((timer.ALWAYS_ON == expected_on) &&
                        (timer.ALWAYS_OFF == expected_off)) {
                        console.log("update"); // TODO add animation to confirm
                        // TODO color time in green when currently active
                    }
                    else {
                        alert(TRANSLATIONS.error_updating_button_state);
                    }
                    break;
                }
            }
        })();
    };
}

function create_timer_show_box(timer_time) {
    const new_timer_box = document.createElement("div");
    new_timer_box.className = "timer";

    const time_start_label = document.createElement("span");
    const time_start_time = document.createElement("span");
    const time_label_separator = document.createElement("span");
    const time_end_label = document.createElement("span");
    const time_end_time = document.createElement("span");

    time_start_label.className = "timer-label";
    time_start_label.innerHTML = TRANSLATIONS.time_start_label;
    time_end_label.className = "timer-label";
    time_end_label.innerHTML = TRANSLATIONS.time_end_label;

    time_label_separator.className = "separator";
    time_label_separator.innerHTML = "—";

    time_start_time.className = "timer-time";
    time_end_time.className = "timer-time";

    time_start_time.innerHTML = timer_time.START;
    time_end_time.innerHTML = timer_time.END;

    new_timer_box.appendChild(time_start_label);
    new_timer_box.appendChild(time_start_time);
    new_timer_box.appendChild(time_label_separator);
    new_timer_box.appendChild(time_end_label);
    new_timer_box.appendChild(time_end_time);

    return new_timer_box;
}

function on_edit_times_clicked(timer) {
    ui_elements.window_time_list.innerHTML = "";
    ui_elements.edit_time_list = [];

    for (const single_time of timer.TIMES)
        add_new_timer(single_time.START, single_time.END);

    ui_elements.confirm_changes_button.onclick = () => {
        let time_not_complete = false;

        for (time_data of ui_elements.edit_time_list) {
            if ((time_data.start.value === "") ||
                (time_data.end.value === "")) {

                time_not_complete = true;
                alert(TRANSLATIONS.error_select_time_per_each);
                break;
            }
        }

        if (!time_not_complete) {
            let new_times_array = [];

            for (time_data of ui_elements.edit_time_list) {
                new_times_array.push({
                    "START": time_data.start.value,
                    "END": time_data.end.value
                })
            }

            (async () => {
                await set_timer_times_at_index(timer.SETTING_IDX, new_times_array);
                ui_elements.edit_window.style.display = 'none';
                refresh_entire_timer_data();
            })();
        }
    };

    ui_elements.edit_window.style.display = 'flex';
}

async function refresh_entire_timer_data() {
    let timers_json_data = await fetch_timer_config();

    ui_elements.container.innerHTML = "";

    for (const timer of timers_json_data) {
        const container_box = document.createElement("div");

        if (!("SETTING_IDX" in timer)) {
            // elements without setting idx are separators
            container_box.className = "separator-box";
        } else {
            // other elements are timers
            container_box.className = "box";

            const timer_title = document.createElement("div");
            timer_title.className = "box-header";
            timer_title.innerHTML = "<h2>" + timer.NAME + "</h2>";
            container_box.appendChild(timer_title);

            const timers_box = document.createElement("div");
            timers_box.className = "timers";

            for (const timer_time of timer.TIMES) {
                const new_timer_box = create_timer_show_box(timer_time);
                timers_box.appendChild(new_timer_box);
            }

            container_box.appendChild(timers_box);

            const controls_container_box = document.createElement("div");
            controls_container_box.className = "controls";

            const edit_times_button = document.createElement("button");
            edit_times_button.className = "btn-edit";
            edit_times_button.innerHTML = TRANSLATIONS.edit_times;

            edit_times_button.onclick = () => on_edit_times_clicked(timer);

            controls_container_box.appendChild(edit_times_button);

            const toggle_buttons_container = document.createElement("div");
            toggle_buttons_container.className = "toggle-buttons";

            const button_toggle_on = document.createElement("button");
            const button_toggle_off = document.createElement("button");

            button_toggle_on.className = "btn-toggle btn-on";
            button_toggle_off.className = "btn-toggle btn-off";

            if (timer.ALWAYS_ON)
                button_toggle_on.classList.add("active");
            else if (timer.ALWAYS_OFF)
                button_toggle_off.classList.add("active");

            button_toggle_on.innerHTML = TRANSLATIONS.always_on;
            button_toggle_off.innerHTML = TRANSLATIONS.always_off;

            set_always_button(button_toggle_on, button_toggle_off, timer.SETTING_IDX, true);
            set_always_button(button_toggle_off, button_toggle_on, timer.SETTING_IDX, false);

            toggle_buttons_container.appendChild(button_toggle_on);
            toggle_buttons_container.appendChild(button_toggle_off);

            controls_container_box.appendChild(toggle_buttons_container);

            container_box.appendChild(controls_container_box);
        }

        ui_elements.container.appendChild(container_box);
    }
}
