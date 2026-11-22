use wasm_bindgen::prelude::*;

/// Matches the original JavaScript FNV-1a implementation over UTF-16 code units.
/// Keeping UTF-16 parity means existing character IDs keep the same deterministic
/// ability selection when the project moves from JavaScript to WebAssembly.
#[wasm_bindgen]
pub fn stable_hash(name: &str, id: &str) -> u32 {
    let input = format!("{}|{}", name, id);
    let mut hash: u32 = 2_166_136_261;
    for unit in input.encode_utf16() {
        hash ^= unit as u32;
        hash = hash.wrapping_mul(16_777_619);
    }
    hash
}

fn xorshift32(state: &mut u32) -> f64 {
    *state ^= *state << 13;
    *state ^= *state >> 17;
    *state ^= *state << 5;
    (*state as f64) / 4_294_967_296.0
}

/// Deterministic random values used to create stable character profiles.
#[wasm_bindgen]
pub fn random_values(seed: u32, count: u32) -> Vec<f64> {
    let mut state = seed;
    (0..count.min(128)).map(|_| xorshift32(&mut state)).collect()
}

/// Utility-AI decision selection. The previous action is excluded where possible
/// to prevent an agent from becoming stuck repeating one behaviour forever.
#[wasm_bindgen]
pub fn choose_action(
    curiosity: f64,
    sociability: f64,
    energy_trait: f64,
    creativity: f64,
    agent_energy: f64,
    personality: &str,
    pointer_near: bool,
    user_active: bool,
    previous: &str,
) -> String {
    let choices = vec![
        ("look", 0.28 + curiosity * 0.45 + if pointer_near { 0.35 } else { 0.0 }),
        ("wander", 0.12 + energy_trait * 0.55 + if personality == "Energetic" { 0.35 } else { 0.0 }),
        ("wave", 0.08 + sociability * 0.45 + if user_active { 0.35 } else { 0.0 }),
        ("think", 0.18 + if personality == "Calm" { 0.4 } else { 0.0 }),
        ("rest", if agent_energy < 0.35 { 1.2 } else { 0.08 + if personality == "Shy" { 0.15 } else { 0.0 } }),
        ("play", 0.1 + if personality == "Playful" { 0.55 } else { 0.0 }),
        ("create", 0.1 + creativity * 0.4 + if personality == "Creative" { 0.55 } else { 0.0 }),
    ];
    let mut best: Option<(&str, f64)> = None;
    for (action, score) in &choices {
        if *action == previous { continue; }
        if best.map_or(true, |(_, best_score)| *score > best_score) {
            best = Some((*action, *score));
        }
    }
    if best.is_none() {
        for (action, score) in &choices {
            if best.map_or(true, |(_, best_score)| *score > best_score) {
                best = Some((*action, *score));
            }
        }
    }
    best.map(|(action, _)| action.to_string()).unwrap_or_else(|| "idle".to_string())
}

/// A single deterministic physics integration step for the desktop simulation.
/// Returns [x, y, vx, vy, facing]. This only moves virtual characters.
#[wasm_bindgen]
pub fn integrate_motion(
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    dt: f64,
    floor: f64,
    width: f64,
    pointer_x: f64,
    pointer_active: bool,
    stay: bool,
    wandering: bool,
    goal_x: f64,
    facing: f64,
) -> Vec<f64> {
    let mut next_x = x;
    let mut next_y = y;
    let mut next_vx = vx;
    let mut next_vy = vy;
    let mut next_facing = if facing == 0.0 { 1.0 } else { facing };
    let step = dt.clamp(0.0, 100.0);

    if pointer_active {
        next_vx += (pointer_x - next_x) * 0.00035 * step;
        let direction = (pointer_x - next_x).signum();
        if direction != 0.0 { next_facing = direction; }
    } else if !stay && wandering {
        next_vx += (goal_x - next_x).signum() * 0.004 * step;
    }

    next_vx *= 0.92_f64.powf(step / 16.67);
    next_vy += 0.00055 * step;
    next_x += next_vx * step / 16.67;
    next_y += next_vy * step / 16.67;

    if next_y > floor {
        next_y = floor;
        next_vy = 0.0;
    }

    let max_x = (width - 20.0).max(20.0);
    if next_x < 20.0 {
        next_x = 20.0;
        next_vx = next_vx.abs();
        next_facing = 1.0;
    }
    if next_x > max_x {
        next_x = max_x;
        next_vx = -next_vx.abs();
        next_facing = -1.0;
    }

    vec![next_x, next_y, next_vx, next_vy, next_facing]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn profile_seed_is_stable_for_unicode_names() {
        assert_eq!(stable_hash("Bóng Đêm", "character-1"), 271_998_269);
        assert_eq!(stable_hash("Shadow", "1"), 2_709_597_122);
        assert_eq!(stable_hash("Echo", "1"), 1_149_663_419);
    }

    #[test]
    fn random_stream_is_repeatable() {
        assert_eq!(random_values(1234, 8), random_values(1234, 8));
        assert!(random_values(9, 8).iter().all(|v| *v >= 0.0 && *v < 1.0));
    }

    #[test]
    fn decision_avoids_previous_action() {
        let action = choose_action(0.9, 0.7, 0.8, 0.7, 0.8, "Curious", true, true, "look");
        assert_ne!(action, "look");
    }

    #[test]
    fn physics_clamps_to_virtual_floor_and_edges() {
        let result = integrate_motion(19.0, 100.0, -1.0, 5.0, 16.67, 100.0, 300.0, 0.0, false, false, false, 100.0, 1.0);
        assert_eq!(result[0], 20.0);
        assert_eq!(result[1], 100.0);
        assert_eq!(result[4], 1.0);
    }
}
