pc = 0;
cycles = 0;

rf = new Int32Array(32);
for (i = 0; i < 32; i++) rf[i] = 0
iMem = {};
dMem = {};
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
    console.log("PC ", pc.toString(16))
    dInst = decode(inst);
    rVal1 = rf[dInst.src1];
    rVal2 = rf[dInst.src2];

    eInst = execute(dInst, rVal1, rVal2, pc);

    document.getElementById("execute").innerHTML = "Decode: "
    document.getElementById("execute").innerHTML += JSON.stringify(dInst)
    document.getElementById("execute").innerHTML += "\n\nExecute: "
    document.getElementById("execute").innerHTML += JSON.stringify(eInst)

    if (eInst.iType == LOAD)
        eInst.data = getLoadData(dMem[eInst.addr & (~0x3)], eInst.addr & 0x3, dInst.memFunc)
    if (eInst.data == undefined) { eInst.data = 0 }

    else if (eInst.iType == STORE) {

        dMem[eInst.addr] = getStoreData(dMem[eInst.addr], eInst.data, eInst.addr & (0x3), dInst.memFunc)
        if (eInst.addr == 0xf000fff0) {
            res = String.fromCharCode(eInst.data);
            console.log("FROM PROCESSOR: ", res)
            document.getElementById("console").innerHTML += res
        } else if (eInst.addr == 0xf000fff8) {
            console.log("Exited with code ", eInst.data)
            document.getElementById("console").innerHTML += "\n\nExited with code " + String(eInst.data)
            return -1
        }
        document.getElementById("memupdate").innerHTML = "Updating MEM addr 0x" + eInst.addr.toString(16) + " with 0x" + eInst.data.toString(16)

    }
    if (isValid(eInst.dst)) {
        if (eInst.dst.data != 0) {
            rf[eInst.dst.data] = parseInt(toBinary(eInst.data, bits = 32), 2)
            document.getElementById("regupdate").innerHTML = "Updating REGISTER x" + String(eInst.dst.data) + " with 0x" + rf[eInst.dst.data].toString(16)
        }
    }
    document.getElementById("instr").innerHTML = "pc: " + pc.toString(16) + " -- " + getAsm(inst)

    document.getElementById("registers").innerHTML = "pc: " + pc.toString(16) + "\n"

    pc = eInst.nextPc;

    for (i = 0; i < rf.length; i++) {
        document.getElementById("registers").innerHTML += "x" + String(i) + ": 0x" + rf[i].toString(16) + "\n"
    }
    document.getElementById("memory").innerHTML = ""
    for (const [key, value] of Object.entries(dMem)) {
        document.getElementById("memory").innerHTML += (`0x${key.toString(16)}: 0x${value.toString(16)}`) + "\n";
    }

    if (eInst.iType == Unsupported) {
        document.getElementById("console").innerHTML += "\n\nReached unsupported instruction...Quitting at pc=0x" + pc.toString(16)
        console.log("Reached unsupported instruction (0x%x)", inst);
        console.log("Dumping the state of the processor");
        console.log("pc = 0x%x", pc);
        console.log(rf.fshow);
        console.log("Quitting simulation.");
        return -1
    }

    cycles <= cycles + 1;
    if (cycles >= 2000000000) {
        document.getElementById("console").innerHTML += "\n\nInfinite loop detected or cycle count exceeded...Quitting at pc=" + String(pc)
        console.log("Dumping the state of the processor");
        console.log("pc = 0x%x (Infinite loop detected)", pc);
        console.log(rf.fshow);
        console.log("Quitting simulation.");

        return -1
    }

    return 0

}
function updateMem(data) {
    pointer = 0
    imem_split = data.split("\n")
    for (i = 0; i < imem_split.length; i++) {
        line = imem_split[i]
        if (line[0] == "@") {
            pointer = parseInt("0x" + line.split("@")[1]) << 2
        } else {
            data = parseInt("0x" + line)
            if (isNaN(data)) continue
            console.log(pointer, data)
            iMem[pointer] = data
            pointer += 4
        }
    }
    dMem = iMem
    document.getElementById("memory").innerHTML = ""
    for (const [key, value] of Object.entries(dMem)) {
        document.getElementById("memory").innerHTML += (`0x${key.toString(16)}: 0x${value.toString(16)}`) + "\n";
    }

}