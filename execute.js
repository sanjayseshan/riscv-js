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

function execute(dInst, rVal1, rVal2, pc) {

    let imm = parseInt(toBinary(dInst.imm, bits = 32), 2)

    let brFunc = dInst.brFunc;
    let aluFunc = dInst.aluFunc;
    let aluVal2 = dInst.iType == OPIMM ? imm : rVal2;

    switch (dInst.iType) {
        case AUIPC: data = pc + imm; break;
        case LUI: data = imm; break;
        case OP: data = alu(rVal1, aluVal2, aluFunc); break;
        case OPIMM: data = alu(rVal1, aluVal2, aluFunc); break;
        case JALR: data = pc + 4; break;
        case JAL: data = pc + 4; break;
        case STORE: data = rVal2; break;
        default: data = 0;
    }
    switch (dInst.iType) {
        case BRANCH: nextPc = (aluBr(rVal1, rVal2, brFunc)) ? pc + imm : pc + 4; break;
        case JAL: nextPc = pc + imm; break;
        case JALR: nextPc = (rVal1 + imm) & ~1; break;
        default: nextPc = pc + 4; break;
    }
    addr = rVal1 + imm;
    return { iType: dInst.iType, dst: dInst.dst, data: parseInt(toBinary(data & 0xffffffff, bits = 32), 2), addr: parseInt(toBinary(addr & 0xffffffff, bits = 32), 2), nextPc: nextPc & 0xffffffff, memFunc: dInst.memFunc };
}