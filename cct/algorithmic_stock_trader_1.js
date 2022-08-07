function isArraySortedDescending(a) {
    let i = 1;
    while (i < a.length) {
        if (a[i - 1] < a[i]) {
            return false;
        }
        i++;
    }
    return true;
}

/** @param {NS} ns */
export async function main(ns) {
    const INPUT_ARRAY = ns.args[0].split(",").map(e => {
        return parseInt(e)
    });

    if (isArraySortedDescending(INPUT_ARRAY)) {
        ns.alert("No profit can be made. (0)");
    }

    let nextHighs = [];
    let isDecending = true;
    let i = 1;
    while (i < INPUT_ARRAY.length) {
        nextHighs.push(0);
        if (isDecending) {
            if (INPUT_ARRAY[i] > INPUT_ARRAY[i - 1]) {
                isDecending = false;
            }
        } else {
            if (INPUT_ARRAY[i] < INPUT_ARRAY[i - 1]) {
                isDecending = true;
                let j = i - 1;
                while (j >= 0) {
                    nextHighs[j] = INPUT_ARRAY[i - 1];
                    j--;
                    if (j >= 0 && nextHighs[j] > nextHighs[j + 1]) {
                        break;
                    }
                }
            }
        }
        i++;
    }
    if (!isDecending) {
        let j = i - 1;
        while (j >= 0) {
            nextHighs[j] = INPUT_ARRAY[i - 1];
            j--;
            if (j >= 0 && nextHighs[j] > nextHighs[j + 1]) {
                break;
            }
        }
    }

    ns.tprint("Map of reachable high's:");
    ns.tprint(nextHighs);

    let currentMaxProfit = 0;
    i = 0;
    while (i < INPUT_ARRAY.length) {
        if (nextHighs[i] - INPUT_ARRAY[i] > currentMaxProfit) {
            currentMaxProfit = nextHighs[i] - INPUT_ARRAY[i];
        }
        i++;
    }
    ns.tprint("Maximum profit: " + currentMaxProfit);
    ns.alert("Maximum profit: " + currentMaxProfit);
}