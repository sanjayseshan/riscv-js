function signedLT(a, b) {
    return lt32(a, b, 1)
}
function signedGE(a, b) {
    return !lt32(a, b, 1)
}
function aluBr(a, b, brFunc) {
    switch (brFunc) {
        case Eq: res = (a == b); break;
        case Neq: res = (a != b); break;
        case Lt: res = signedLT(a, b); break;
        case Ltu: res = (a < b); break;
        case Ge: res = signedGE(a, b); break;
        case Geu: res = (a >= b); break;
        default: False;
    }
    return res;
}

function getIn() {
    tmp = document.getElementById("inbuf").value
    if (tmp == "") {
        console.log("TO PROCESSOR ","",0)
        return 0
    }
    c = tmp[0]
    console.log("TO PROCESSOR ",c, c.charCodeAt(0))
    document.getElementById("inbuf").value=document.getElementById("inbuf").value.substring(1)
    return c.charCodeAt(0)
}


var _eInst = { iType: 0, dst: null, data: 0, addr: 0, nextPc: 0, memFunc: 0 };

function execute(dInst, rVal1, rVal2, pc) {
    let imm = dInst.imm;

    let brFunc = dInst.brFunc;
    let aluFunc = dInst.aluFunc;
    let aluVal2 = dInst.iType == OPIMM ? imm : rVal2;
    let data = 0;
    let nextPc = (pc + 4) >>> 0;

    switch (dInst.iType) {
        case AUIPC: data = (pc + imm) >>> 0; break;
        case LUI: data = imm >>> 0; break;
        case OP: data = alu(rVal1, aluVal2, aluFunc) >>> 0; break;
        case OPIMM: data = alu(rVal1, aluVal2, aluFunc) >>> 0; break;
        case JALR: data = (pc + 4) >>> 0; break;
        case JAL: data = (pc + 4) >>> 0; break;
        case STORE: data = rVal2 >>> 0; break;
        default: data = 0;
    }
    switch (dInst.iType) {
        case BRANCH: nextPc = (aluBr(rVal1, rVal2, brFunc)) ? ((pc + imm) >>> 0) : ((pc + 4) >>> 0); break;
        case JAL: nextPc = (pc + imm) >>> 0; break;
        case JALR: nextPc = ((rVal1 + imm) & ~1) >>> 0; break;
        default: nextPc = (pc + 4) >>> 0; break;
    }
    let addr = (rVal1 + imm) >>> 0;
    _eInst.iType = dInst.iType;
    _eInst.dst = dInst.dst;
    _eInst.data = data;
    _eInst.addr = addr;
    _eInst.nextPc = nextPc;
    _eInst.memFunc = dInst.memFunc;
    return _eInst;
}