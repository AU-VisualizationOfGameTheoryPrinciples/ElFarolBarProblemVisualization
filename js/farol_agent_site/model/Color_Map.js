function setupColorMap(TOTAL_DAYS) {
    var color_map_length = TOTAL_DAYS > 10 ? TOTAL_DAYS : 10;
    let colorMap = new Array(color_map_length);

    for(let i = 0; i < color_map_length;) {
        if(i<10){
            colorMap[i] = `rgb(${100-20*Math.floor(i/3)}%, 0%, 0%)`;
            colorMap[i+1] = `rgb(0%, ${100-20*Math.floor(i/3)}%, 0%)`;
            colorMap[i+2] = `rgb(0%, 0%, ${100-20*Math.floor(i/3)}%)`;
        } else {
            let square = (i*i)%100;
            let ten = (10*i)%100;
            colorMap[i] = `rgb(100%, ${square}%, ${ten}%)`;
            colorMap[i+1] = `rgb(${ten}%, 100%, ${square}%)`;
            colorMap[i+2] = `rgb(${square}%, ${ten}%, 100%)`;
        }
        i = i + 3;
    }

    return colorMap;
}

export { setupColorMap };