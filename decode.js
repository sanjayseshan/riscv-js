

function Valid(x) {
    return { valid: true, data: x }
}

Invalid = { valid: false, data: 0 }

function splice(number, end, start) {
    const length = end - start + 1;
    const mask = (1 << length) - 1;
    const shiftedNumber = number >> start;
    return shiftedNumber & mask;
}

function signExtend(x, size) {
    let shift = 32 - size;
    return (x << shift) >> shift;
}

function zeroExtend(x) {
    return x
}
function unpack(x) {
    return {}
}

var _validDst = { valid: true, data: 0 };
var _invalidDst = { valid: false, data: 0 };
var _dInst = { iType: 0, dst: _validDst, src1: 0, src2: 0, imm: 0, brFunc: -1, aluFunc: -1, memFunc: -1 };

function decode(inst) {
    let opcode = splice(inst, 6, 0)
    let funct3 = splice(inst, 14, 12)
    let funct7 = splice(inst, 31, 25)
    let dst = splice(inst, 11, 7)
    let src1 = splice(inst, 19, 15)
    let src2 = splice(inst, 24, 20)

    _validDst.data = dst;
    _validDst.valid = (dst !== 0);

    immB = (splice(inst, 31, 31) << 11) | (splice(inst, 7, 7) << 10) | (splice(inst, 30, 25) << 4) | (splice(inst, 11, 8));
    immB32 = signExtend(immB << 1, 13);

    immU = splice(inst, 31, 12);
    immU32 = immU << 12;

    immI = splice(inst, 31, 20);
    immI32 = signExtend(immI, 12);
    immJ = ((splice(inst, 31, 31) << 18) | (splice(inst, 19, 12) << 11) | (splice(inst, 20, 20) << 10) | (splice(inst, 30, 21)));
    immJ32 = signExtend((immJ << 1), 20);
    immS = (splice(inst, 31, 25) << 5) | splice(inst, 11, 7);
    immS32 = signExtend(immS, 12);

    dInst = _dInst;
    dInst.dst = _validDst;
    dInst.src1 = src1;
    dInst.src2 = src2;
    dInst.imm = 0;
    dInst.brFunc = -1;
    dInst.aluFunc = -1;
    dInst.memFunc = -1;
    dInst.iType = Unsupported;

    switch (opcode) {
        case opAuipc:
            dInst.iType = AUIPC;
            dInst.imm = immU32;
            break;
        case opLui:
            dInst.iType = LUI;
            dInst.imm = immU32;
            break;

        case opOpImm:
            dInst.iType = OPIMM;
            dInst.src1 = src1;
            dInst.imm = immI32;
            dInst.dst = _validDst;

            switch (funct3) {
                case fnAND: dInst.aluFunc = And; break;
                case fnOR: dInst.aluFunc = Or; break;
                case fnXOR: dInst.aluFunc = Xor; break;
                case fnADD: dInst.aluFunc = Add; break;
                case fnSLT: dInst.aluFunc = Slt; break;
                case fnSLTU: dInst.aluFunc = Sltu; break;
                case fnSLL: switch (funct7) {

                    case 0: dInst.aluFunc = Sll;

                        break;
                }break;
                case fnSR: switch (funct7) {
                    case 0b0000000: dInst.aluFunc = Srl; break;
                    case 0b0100000: dInst.aluFunc = Sra; break;
                    default: dInst.iType = Unsupported;
                }break;
                default: dInst.iType = Unsupported;
            }
            break;
        case opOp:

            dInst.iType = OP;
            dInst.src1 = src1;
            dInst.src2 = src2;
            dInst.dst = _validDst;

            switch (funct3) {
                case fnADD: switch (funct7) {

                    case 0b0000000: dInst.aluFunc = Add; break;
                    case 0b0100000: dInst.aluFunc = Sub; break;

                    default: dInst.iType = Unsupported;
                }break;

                case fnAND: switch (funct7) {

                    case 0b0000000: dInst.aluFunc = And; break;

                    default: dInst.iType = Unsupported;
                }break;
                case fnOR: dInst.aluFunc = Or; break;

                case fnXOR: dInst.aluFunc = Xor; break;

                case fnSLT: dInst.aluFunc = Slt; break;

                case fnSLTU: dInst.aluFunc = Sltu; break;

                case fnSLL: dInst.aluFunc = Sll; break;

                case fnSR: switch (funct7) {
                    case 0b0000000: dInst.aluFunc = Srl; break;
                    case 0b0100000: dInst.aluFunc = Sra; break;
                    default: dInst.iType = Unsupported;
                }break;
                default: dInst.iType = Unsupported;
            }

            break;
        case opBranch:
            dInst.iType = BRANCH;
            dInst.src1 = src1;
            dInst.src2 = src2;
            dInst.imm = immB32;
            dInst.dst = _invalidDst;

            switch (funct3) {
                case fnBEQ: dInst.brFunc = Eq; break;
                case fnBNE: dInst.brFunc = Neq; break;
                case fnBLT: dInst.brFunc = Lt; break;
                case fnBGE: dInst.brFunc = Ge; break;
                case fnBLTU: dInst.brFunc = Ltu; break;
                case fnBGEU: dInst.brFunc = Geu; break;
                default: dInst.iType = Unsupported; break;
            }
            break;
        case opJal:
            dInst.iType = JAL;
            dInst.dst = _validDst;
            dInst.src1 = 0;
            dInst.src2 = 0;
            dInst.imm = immJ32;
            break;
        case opLoad:
            dInst.iType = LOAD;
            dInst.dst = _validDst;
            dInst.src1 = src1;
            dInst.src2 = 0;
            dInst.imm = immI32;
            switch (funct3) {
                case fnLW: dInst.memFunc = Lw; break;
                case fnLB: dInst.memFunc = Lb; break;
                case fnLH: dInst.memFunc = Lh; break;
                case fnLBU: dInst.memFunc = Lbu; break;
                case fnLHU: dInst.memFunc = Lhu; break;
                default: dInst.iType = Unsupported;
            }
            break;
        case opStore:
            dInst.iType = STORE;
            dInst.dst = _invalidDst;
            dInst.src1 = src1;
            dInst.src2 = src2;
            dInst.imm = immS32;
            switch (funct3) {
                case fnSW: dInst.memFunc = Sw; break;
                case fnSB: dInst.memFunc = Sb; break;
                case fnSH: dInst.memFunc = Sh; break;
                default: dInst.iType = Unsupported;
            }
            break;
        case opJalr:
            dInst.iType = JALR;
            dInst.dst = _validDst;
            dInst.src1 = src1;
            dInst.src2 = src2;
            dInst.imm = immI32;
            break;
    }

    return dInst;
}
