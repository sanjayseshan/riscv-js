function lt32(a, b, isSigned) {
    ret = 0;

    mask = ~(1 << 31);
    maska = (splice(a, 31, 31) << 31);
    maskb = (splice(b, 31, 31) << 31);
    a = (isSigned == 1) ? (a & mask) | maska : a;
    b = (isSigned == 1) ? (b & mask) | maskb : b;
    ret = a < b;
    return ret;
}

function alu(a, b, func) {
    ret = 0;

    addType = 0;
    addType = (func == Add) ? 0 : addType;
    addType = (func == Sub) ? 1 : addType;
    ret = (func == Add || func == Sub) ? ((addType == 0) ? a + b : a - b) : ret;

    ret = (func == And) ? a & b : ret;
    ret = (func == Or) ? a | b : ret;
    ret = (func == Xor) ? a ^ b : ret;

    sltType = 0;
    sltType = (func == Slt) ? 1 : sltType;
    sltType = (func == Sltu) ? 0 : sltType;
    ret = (func == Slt || func == Sltu) ? zeroExtend(lt32(a, b, sltType)) : ret;

    ret = (func == Srl) ? a >>> b : ret;
    ret = (func == Sra) ? a >> b : ret;
    ret = (func == Sll) ? a << b : ret;

    return ret;
}

function truncate(x) {
    return x
}
function getLoadData(word, byteOffset, op) {

    ret = 0;
    if (op == Lw) ret = word;
    else if (op == Lb || op == Lbu) {
        tmp = 0;
        if (byteOffset == 0)
            tmp = truncate(word & 0xff);
        else if (byteOffset == 1)
            tmp = truncate((word & 0xff00) >> 8);
        else if (byteOffset == 2)
            tmp = truncate((word & 0xff0000) >> 16);
        else if (byteOffset == 3)
            tmp = truncate((word & 0xff000000) >> 24);
        ret = (op == Lb) ? signExtend(tmp, 8) : zeroExtend(tmp);
    } else if (op == Lh || op == Lhu) {
        tmp = 0;

        if (byteOffset == 0)
            tmp = truncate(word & 0xffff);
        else if (byteOffset == 2)
            tmp = truncate((word & 0xffff0000) >> 16);
        ret = (op == Lh) ? signExtend(tmp, 16) : zeroExtend(tmp);
    }
    return ret;
}

function getStoreData(currentData, newData, byteOffset, op) {
    ret = currentData;


    if (op == Sw) ret = newData;
    else if (op == Sb) {
        if (byteOffset == 0) {
            ret = ret & (~0xff)
            ret = ret | (newData & 0xff);
        } else if (byteOffset == 1) {
            ret = ret & (~0xff00)
            ret = ret | (newData & 0xff);
        } else if (byteOffset == 2) {
            ret = ret & (~0xff0000)
            ret = ret | (newData & 0xff);
        } else if (byteOffset == 3) {
            ret = ret & (~0xff000000)
            ret = ret | (newData & 0xff);
        } else if (op == Sh) {
            if (byteOffset == 0) {
                ret = ret & (~0xffff)
                ret = ret | (newData & 0xffff);
            } else if (byteOffset == 2) {

                ret = ret & (~0xffff0000)
                ret = ret | (newData & 0xffff);
            }
        }
    }
    return ret;
}