import { STATE_SETUP } from "../GlobalDefinitions";

export default {
    "liberal-policies": 0,
    "fascist-policies": 0,
    "discard-size": 0,
    "draw-size": 17,
    "players": {
        "P1": {"alive": true, "id": "FASCIST", "investigated": false},
        "P2": {"alive": true, "id": "HITLER", "investigated": false},
        "P3": {"alive": true, "id": "LIBERAL", "investigated": true},
        "P4": {"alive": true, "id": "LIBERAL", "investigated": false},
        "P5": {"alive": true, "id": "LIBERAL", "investigated": false},
        "P6": {"alive": false, "id": "FASCIST", "investigated": false},
        "P7": {"alive": true, "id": "LIBERAL", "investigated": false}
    },
    "in-game": true,
    "player-order": ["P4", "P2", "P6", "P1", "P7", "P3", "P5"],
    "state": STATE_SETUP,
    "last-president": "P7",
    "last-chancellor": "P3",
    "president": "P4",
    "chancellor": "P5",
    "election-tracker": 0,
    "user-votes": {"P4": true, "P2": false, "P1": false, "P7": true, "P3": false, "P5": true},
    "icon": {
        "P1": "p5",
        "P2": "p9",
        "P3": "p8",
        "P4": "p15",
        "P5": "p_default",
        "P6": "p4",
        "P7": "p2"
    },
    "veto-occurred": false
};