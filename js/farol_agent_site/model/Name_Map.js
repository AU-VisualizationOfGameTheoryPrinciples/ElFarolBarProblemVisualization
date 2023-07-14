function setupNames(AGENTS_NR, has_player_agent) {
    let nameMap = new Array(AGENTS_NR);
    nameMap.fill("Rando");
    if(has_player_agent){
        nameMap[0] = "You";
    }

    return nameMap;
}

export { setupNames };