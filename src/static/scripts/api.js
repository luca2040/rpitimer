async function generic_fetch(url, method, content) {
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`error when fetching server: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('error: ', error);
    throw error;
  }
}

async function set_always_state_request(setting_idx, always_off, always_on) {
  return await generic_fetch(
    '/set-always-state',
    'POST',
    {
      SETTING_IDX: setting_idx,
      ALWAYS_OFF: always_off,
      ALWAYS_ON: always_on
    })
}

async function set_timer_times_at_index(setting_idx, timers_data) {
  return await generic_fetch(
    '/set-timer-times',
    'POST',
    {
      SETTING_IDX: setting_idx,
      TIMES: timers_data
    }
  )
}

async function fetch_timer_config() {
  try {
    const response_timers = await fetch('/config/timers');

    if (!response_timers.ok)
      throw new Error('error fetching timer config');

    return await response_timers.json();
  } catch (error) {
    console.error('error fetching timer config:', error);
  }
}