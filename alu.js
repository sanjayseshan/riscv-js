function lt32(a, b, isSigned) {
    if (isSigned) {
        return (a | 0) < (b | 0);
    }
    return (a >>> 0) < (b >>> 0);
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
    if (word === undefined) word = 0;
    let ret = 0;
    if (op == Lw) ret = word;
    else if (op == Lb || op == Lbu) {
        let tmp = (word >>> (byteOffset * 8)) & 0xff;
        ret = (op == Lb) ? signExtend(tmp, 8) : tmp;
    } else if (op == Lh || op == Lhu) {
        let tmp = (word >>> (byteOffset * 8)) & 0xffff;
        ret = (op == Lh) ? signExtend(tmp, 16) : tmp;
    }
    return ret;
}

function getStoreData(currentData, newData, byteOffset, op) {
    if (currentData === undefined) currentData = 0;
    let ret = currentData;

    if (op == Sw) {
        ret = newData;
    } else if (op == Sb) {
        let shift = byteOffset * 8;
        let mask = ~(0xff << shift);
        ret = (currentData & mask) | ((newData & 0xff) << shift);
    } else if (op == Sh) {
        let shift = byteOffset * 8;
        let mask = ~(0xffff << shift);
        ret = (currentData & mask) | ((newData & 0xffff) << shift);
    }
    return ret >>> 0;
}