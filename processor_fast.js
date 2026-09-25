pc = 0;
cycles = 0;

rf = new Uint32Array(32);
for (i = 0; i < 32; i++) rf[i] = 0
iMem = {};
dMem = {};
consoleBuffer = "";

function flushConsole() {
    if (consoleBuffer.length > 0) {
        let c = document.getElementById("console");
        if (c) {
            c.innerHTML += consoleBuffer;
            c.scrollTop = c.scrollHeight;
        }
        consoleBuffer = "";
    }
}

function isValid(x) {
    if (x == undefined) return false;
    return x.valid
}

function toBinary(number, bits = 8) {
    if (number >= 0) {
        return number.toString(2).padStart(bits, '0');
    } else {
        const positiveBinary = Math.abs(number).toString(2).padStart(bits, '0');
        const invertedBinary = positiveBinary.replace(/[01]/g, (bit) => bit === '0' ? '1' : '0');
        const twosComplement = (parseInt(invertedBinary, 2) + 1).toString(2).padStart(bits, '0');
        return twosComplement;
    }
}

function Processor() {

    inst = iMem[pc];
    if (inst === undefined) {
        let c = document.getElementById("console");
        if (c) {
            c.innerHTML += "\n\nPC out of bounds: 0x" + pc.toString(16);
            c.scrollTop = c.scrollHeight;
        }
        return -1;
    }

    dInst = decode(inst);
    rVal1 = rf[dInst.src1];
    rVal2 = rf[dInst.src2];

    eInst = execute(dInst, rVal1, rVal2, pc);
    if (eInst.iType == LOAD) {
        let wordAddr = (eInst.addr & ~0x3) >>> 0;
        eInst.data = getLoadData(dMem[wordAddr], eInst.addr & 0x3, dInst.memFunc)
        if (eInst.addr == 0xF000fff4) eInst.data = getIn()
        if (eInst.data == undefined) { eInst.data = 0 }

    } else if (eInst.iType == STORE) {
        let wordAddr = (eInst.addr & ~0x3) >>> 0;
        dMem[wordAddr] = getStoreData(dMem[wordAddr], eInst.data, eInst.addr & 0x3, dInst.memFunc)
        if (eInst.addr == 0xf000fff0 || eInst.addr == 0x40000000) {
            consoleBuffer += String.fromCharCode(eInst.data);
            if (consoleBuffer.length >= 256) flushConsole();
        } else if (eInst.addr == 0xf000fff4 || eInst.addr == 0x40000004) {
            consoleBuffer += eInst.data.toString();
            if (consoleBuffer.length >= 256) flushConsole();
        } else if (eInst.addr == 0xf000fff8 || eInst.addr == 0x40001000) {
            flushConsole();
            console.log("Exited with code ", eInst.data)
            document.getElementById("console").innerHTML += "\n\nExited with code " + String(eInst.data)
            return -1
        }
    }
    if (isValid(eInst.dst)) {
        if (eInst.dst.data != 0) {
            rf[eInst.dst.data] = eInst.data >>> 0;
        }
    }
    pc = eInst.nextPc;

    if (eInst.iType == Unsupported) {
        document.getElementById("console").innerHTML += "\n\nReached unsupported instruction...Quitting at pc=0x" + pc.toString(16)
        console.log("Reached unsupported instruction (0x%x)", inst);
        console.log("Dumping the state of the processor");
        console.log("pc = 0x%x", pc);
        console.log(rf.fshow);
        console.log("Quitting simulation.");
        return -1
    }

    cycles++;
    // Uncapped cycle limit for OS boot simulation


    return 0

}
function updateMem(data) {
    let pointer = 0;
    let len = data.length;
    let lineStart = 0;
    let isHexVal = false;
    let num = 0;

    for (let i = 0; i <= len; i++) {
        let ch = i < len ? data.charCodeAt(i) : 10;
        if (ch === 10 || ch === 13) {
            if (i > lineStart) {
                let firstChar = data.charCodeAt(lineStart);
                if (firstChar === 64 /* '@' */) {
                    let hexStr = data.substring(lineStart + 1, i).trim();
                    if (hexStr.length > 0) {
                        pointer = (parseInt(hexStr, 16) << 2) >>> 0;
                    }
                } else {
                    let valStr = data.substring(lineStart, i).trim();
                    if (valStr.length > 0) {
                        let val = parseInt(valStr, 16);
                        if (!isNaN(val)) {
                            // Don't waste object keys on 0 if memory is sparse, or store directly:
                            if (val !== 0) {
                                iMem[pointer] = val >>> 0;
                            }
                            pointer = (pointer + 4) >>> 0;
                        }
                    }
                }
            }
            lineStart = i + 1;
        }
    }
    dMem = iMem;
}