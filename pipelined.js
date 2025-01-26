pc = 0;
cycles = 0;

rf = new Int32Array(32);
for (i = 0; i < 32; i++) rf[i] = 0
iMem = {};
dMem = {};
cacheMM = {};
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

False = false
True = true

function fetch(input) {
    let fetchAction = input.fetchAction;

    if (fetchAction == Dequeue) {
        pc = pc + 4;
        data = iMem[pc];
    } else if (fetchAction == Redirect) {
        pc = input.redirectPC;
        data = iMem[input.redirectPC];
    } else
        data = iMem[pc];

    return Valid({ pc: pc, inst: data })
}
function fromMaybe(d, x) {
    if (isValid(x)) return x.data
    else return d
}

Dequeue = "Dequeue"
Stall = "Stall"
Redirect = "Redirect"

instrs = 0
fetchf2d = Invalid
dCacheData = Invalid
d2e = Invalid
e2w = Invalid

function Processor() {

    cycles = cycles + 1;

    dstW = Invalid;
    dataW = Invalid;
    dDataStall = False;

    if (isValid(e2w)) {
        let e2w_v = fromMaybe(-1, e2w);

        console.log(dCacheData.valid, isValid(dCacheData), e2w_v.iType)

        if (!isValid(dCacheData) && e2w_v.iType == LOAD)
            dDataStall = True;
        else if (isValid(e2w_v.dst)) {
            valid_dst = fromMaybe(-1, e2w_v.dst);
            wr_data = e2w_v.data;

            if (e2w_v.iType == LOAD)
                wr_data = fromMaybe(-1, dCacheData);

            if (valid_dst != 0) {
                rf[valid_dst] = parseInt(toBinary(wr_data, bits = 32), 2)
                document.getElementById("regupdate").innerHTML = "Updating REGISTER x" + String(eInst.dst.data) + " with 0x" + rf[eInst.dst.data].toString(16)
            }

            dstW = Valid(valid_dst);
            dataW = Valid(wr_data);
        }

        instrs = instrs + 1;

        if (e2w_v.iType == Unsupported) {
            document.getElementById("console").innerHTML += "\n\nReached unsupported instruction...Quitting at pc=0x" + pc.toString(16)

            console.log("Reached unsupported instruction");
            console.log("Dumping the state of the processor");
            console.log("pc = 0x%x", e2w_v.pc);
            console.log(rf.fshow);
            console.log("Quitting simulation.");
            return -1
        }

    }

    annul = False;
    redirectPC = -1;
    dstE = Invalid;
    dataE = Invalid;

    dReqStall = False;

    if (dDataStall)
        e2w = e2w;
    else if (isValid(d2e)) {
        let d2e_v = fromMaybe(-1, d2e);

        eInst = execute(d2e_v.dInst, d2e_v.rVal1, d2e_v.rVal2, d2e_v.pc);
        if (eInst.iType == LOAD) {

            data = getLoadData(dMem[eInst.addr & (~0x3)], eInst.addr & 0x3, dInst.memFunc)
            dCacheData = Valid(data)
            handleMem(eInst.addr & (~0x3), 0, 0, "d")
            if (data == undefined) { dCacheData = Valid(0) }
        } else if (eInst.iType == STORE) {
            dMem[eInst.addr & (~0x3)] = getStoreData(dMem[eInst.addr & (~0x3)], eInst.data, eInst.addr & (0x3), eInst.memFunc)
            handleMem(eInst.addr & (~0x3), 1, dMem[eInst.addr & (~0x3)], "d")
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

        e2w = Valid({ pc: d2e_v.pc, iType: eInst.iType, data: eInst.data, dst: eInst.dst, inst: d2e_v.inst });

        if (eInst.nextPc != d2e_v.pc + 4) {
            annul = True;
            redirectPC = eInst.nextPc;
        }

        dstE = eInst.dst;
        dataE = Valid(eInst.data);

    } else {
        e2w = Invalid;
    }

    hazardStallE = False;

    if (annul) {
        fetchf2d = fetch({ fetchAction: Redirect, redirectPC: redirectPC });
        d2e = Invalid;
    } else if (dDataStall || dReqStall) {
        fetchf2d = fetch({ fetchAction: Stall, redirectPC: -1 });
        d2e = d2e;
    } else if (isValid(fetchf2d)) {
        let f2d_v = fromMaybe(-1, fetchf2d);

        dInst = decode(f2d_v.inst);

        rVal1 = rf[dInst.src1];
        rVal2 = rf[dInst.src2];

        hazardStallE = (dInst.src1 == fromMaybe(0, dstE) && dInst.src1 != 0)
            || (dInst.src2 == fromMaybe(0, dstE) && dInst.src2 != 0);

        if (hazardStallE) {
            fetchf2d = fetch({ fetchAction: Stall, redirectPC: -1 });
            d2e = Invalid;
        } else {
            if (dInst.src1 == fromMaybe(0, dstW) && dInst.src1 != 0)
                rVal1 = fromMaybe(-1, dataW);
            if (dInst.src2 == fromMaybe(0, dstW) && dInst.src2 != 0)
                rVal2 = fromMaybe(-1, dataW);

            fetchf2d = fetch({ fetchAction: Dequeue, redirectPC: -1 });
            d2e = Valid({ pc: f2d_v.pc, dInst: dInst, rVal1: rVal1, rVal2: rVal2, inst: f2d_v.inst });
        }

    } else {
        fetchf2d = fetch({ fetchAction: Stall, redirectPC: -1 });
        d2e = Invalid;
    }
    document.getElementById("instr").innerHTML = "Fetch pc: " + (pc + 4).toString(16) + "<br>"
    if (isValid(fetchf2d)) document.getElementById("instr").innerHTML += "Decode pc: " + fromMaybe(-1, fetchf2d).pc.toString(16) + " -- " + getAsm(fromMaybe(-1, fetchf2d).inst) + "<br>"
    else document.getElementById("instr").innerHTML += "Decode: NOP<br>"
    if (isValid(d2e)) document.getElementById("instr").innerHTML += "Execute pc: " + fromMaybe(-1, d2e).pc.toString(16) + " -- " + getAsm(fromMaybe(-1, d2e).inst) + "<br>"
    else document.getElementById("instr").innerHTML += "Execute: NOP<br>"
    if (isValid(e2w)) document.getElementById("instr").innerHTML += "Writeback pc: " + fromMaybe(-1, e2w).pc.toString(16) + " -- " + getAsm(fromMaybe(-1, e2w).inst) + "<br>"
    else document.getElementById("instr").innerHTML += "Writeback: NOP<br>"
    document.getElementById("execute").innerHTML = "Fetch2Decode: "
    document.getElementById("execute").innerHTML += JSON.stringify(fetchf2d)
    document.getElementById("execute").innerHTML += "\nDecode2Execute: "
    document.getElementById("execute").innerHTML += JSON.stringify(d2e)
    document.getElementById("execute").innerHTML += "\nExecute2Writeback: "
    document.getElementById("execute").innerHTML += JSON.stringify(e2w)

    document.getElementById("execute").innerHTML += "\n\nHazards: "
    document.getElementById("execute").innerHTML += ("DataStall " + dDataStall + " DataReqStall " + dReqStall + " hazardStall " + hazardStallE)

    document.getElementById("execute").innerHTML += "\n\nBypass (from Writeback): "
    document.getElementById("execute").innerHTML += "dst " + JSON.stringify(dstW) + " "
    document.getElementById("execute").innerHTML += "data " + JSON.stringify(dataW)

    document.getElementById("registers").innerHTML = "pc: 0x" + pc.toString(16) + "\n"

    for (i = 0; i < rf.length; i++) {
        document.getElementById("registers").innerHTML += "x" + String(i) + ": 0x" + rf[i].toString(16) + "\n"
    }
    document.getElementById("memory").innerHTML = ""
    for (const [key, value] of Object.entries(dMem)) {
        document.getElementById("memory").innerHTML += (`0x${parseInt(key).toString(16)}: 0x${value.toString(16)}`) + "\n";
    }

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
    cacheMM = dMem
    document.getElementById("memory").innerHTML = ""
    for (const [key, value] of Object.entries(dMem)) {
        document.getElementById("memory").innerHTML += (`0x${parseInt(key).toString(16)}: 0x${value.toString(16)}`) + "\n";
    }

}