

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
    sign = (x & (1 << (size - 1))) >> (size - 1)
    mask = ~((1 << size) - 1)
    if (sign != 0)
        x = x | mask

    return x
}

function zeroExtend(x) {
    return x
}
function unpack(x) {
    return {}
}

function decode(inst) {
    let opcode = splice(inst, 6, 0)
    let funct3 = splice(inst, 14, 12)
    let funct7 = splice(inst, 31, 25)
    let dst = splice(inst, 11, 7)
    let src1 = splice(inst, 19, 15)
    let src2 = splice(inst, 24, 20)

    validDst = Valid(dst);
    dDst = Invalid;
    dSrc = 0b0;

    immD32 = 0;
    immB = (splice(inst, 31, 31) << 11) | (splice(inst, 7, 7) << 10) | (splice(inst, 30, 25) << 4) | (splice(inst, 11, 8));
    immB32 = signExtend(immB << 1, 13);

    immU = splice(inst, 31, 12);
    immU32 = signExtend(immU << 12, 32);

    immI = splice(inst, 31, 20);
    immI32 = signExtend(immI, 12);
    immJ = ((splice(inst, 31, 31) << 18) | (splice(inst, 19, 12) << 11) | (splice(inst, 20, 20) << 10) | (splice(inst, 30, 21)));
    immJ32 = signExtend((immJ << 1), 20);
    immS = (splice(inst, 31, 25) << 5) | splice(inst, 11, 7);

    immS32 = signExtend(immS, 12);

    dInst = unpack(0);
    dInst.iType = Unsupported;
    switch (opcode) {
        case opAuipc:

            dInst = { iType: AUIPC, dst: validDst, src1: dSrc, src2: dSrc, imm: immU32, brFunc: -1, aluFunc: -1, memFunc: -1 };
            break
        case opLui:
            dInst = { iType: LUI, dst: validDst, src1: dSrc, src2: dSrc, imm: immU32, brFunc: -1, aluFunc: -1, memFunc: -1 };
            break

        case opOpImm:
            dInst.iType = OPIMM;
            dInst.src1 = src1;
            dInst.imm = immI32;
            dInst.dst = validDst;

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
            dInst.dst = validDst;

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
                }
                default: dInst.iType = Unsupported;
            }

            break;
        case opBranch:
            dInst.iType = BRANCH;
            dInst.src1 = src1;
            dInst.src2 = src2;
            dInst.imm = immB32;
            dInst.dst = dDst;

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

            dInst = { iType: JAL, dst: validDst, src1: dSrc, src2: dSrc, imm: immJ32, brFunc: -1, aluFunc: -1, memFunc: -1 };
            break;
        case opLoad:

            switch (funct3) {
                case fnLW: dInst = { iType: LOAD, dst: validDst, src1: src1, src2: dSrc, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: Lw }; break;
                case fnLB: dInst = { iType: LOAD, dst: validDst, src1: src1, src2: dSrc, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: Lb }; break;
                case fnLH: dInst = { iType: LOAD, dst: validDst, src1: src1, src2: dSrc, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: Lh }; break;
                case fnLBU: dInst = { iType: LOAD, dst: validDst, src1: src1, src2: dSrc, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: Lbu }; break;
                case fnLHU: dInst = { iType: LOAD, dst: validDst, src1: src1, src2: dSrc, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: Lhu }; break;
                default: dInst.iType = Unsupported;
            }

            break;
        case opStore:

            switch (funct3) {
                case fnSW: dInst = { iType: STORE, dst: dDst, src1: src1, src2: src2, imm: immS32, brFunc: -1, aluFunc: -1, memFunc: Sw }; break;
                case fnSB: dInst = { iType: STORE, dst: dDst, src1: src1, src2: src2, imm: immS32, brFunc: -1, aluFunc: -1, memFunc: Sb }; break;
                case fnSH: dInst = { iType: STORE, dst: dDst, src1: src1, src2: src2, imm: immS32, brFunc: -1, aluFunc: -1, memFunc: Sh }; break;
                default: dInst.iType = Unsupported;
            }
            break;
        case opJalr:

            fnJALR: dInst = { iType: JALR, dst: validDst, src1: src1, src2: src2, imm: immI32, brFunc: -1, aluFunc: -1, memFunc: -1 };
            break;
    }

    return dInst;
}