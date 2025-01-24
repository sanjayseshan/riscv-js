// typedef Bit#(32) Word;

// ALU function enumeration is provided by imported ALU.ms

// Branch function enumeration
Eq = "Eq"
Neq = "Neq"
Lt = "Lt"
Ltu = "Ltu"
Ge = "Ge"
Geu = "Geu"


// Load/Store function enumeration
Lw="Lw"
Lh="Lh"
Lhu="Lhu"
Lb="Lb"
Lbu="Lbu"
Sw="Sw"
Sh="Sh"
Sb="Sb"


// Helper functions to find whether MemFunc is a load or store
function isStore(op) {
    return (op == Sw) || (op == Sh) || (op == Sb);
}
function isLoad(op) {return !isStore(op);}

// AUIPC added for this lab - Add Upper Immediate to PC
OP="OP"
OPIMM="OPIMM" 
BRANCH="BRANCH"
LUI="LUI"
JAL="JAL"
JALR="JALR"
LOAD="LOAD"
STORE="STORE"
AUIPC="AUIPC"
Unsupported="Unsupported"

// Return type for Decode function
// typedef struct {
//     IType iType;
//     AluFunc aluFunc;
//     BrFunc brFunc;
//     MemFunc memFunc;
//     Maybe#(RIndx) dst;
//     RIndx src1;
//     RIndx src2;
//     Word imm;
// } DecodedInst;

// Register File
// typedef Bit#(5) RIndx;

// typedef struct {
//     RIndx index;
//     Word data;
// } RegWriteArgs;

// Opcode
opOpImm  = 0b0010011;
opOp     = 0b0110011;
opLui    = 0b0110111;
opJal    = 0b1101111;
opJalr   = 0b1100111;
opBranch = 0b1100011;
opLoad   = 0b0000011;
opStore  = 0b0100011;
opAuipc  = 0b0010111;
// funct3 - ALU
fnADD   = 0b000;
fnSLL   = 0b001;
fnSLT   = 0b010;
fnSLTU  = 0b011;
fnXOR   = 0b100;
fnSR    = 0b101;
fnOR    = 0b110;
fnAND   = 0b111;
// funct3 - Branch
fnBEQ   = 0b000;
fnBNE   = 0b001;
fnBLT   = 0b100;
fnBGE   = 0b101;
fnBLTU  = 0b110;
fnBGEU  = 0b111;
// funct3 - Load
fnLW    = 0b010;
fnLB    = 0b000;
fnLH    = 0b001;
fnLBU   = 0b100;
fnLHU   = 0b101;
// funct3 - Store
fnSW    = 0b010;
fnSB    = 0b000;
fnSH    = 0b001;
// funct3 - JALR
fnJALR  = 0b000;

// Return type for Execute function
// typedef struct {
//     IType iType;
//     MemFunc memFunc;
//     Maybe#(RIndx) dst;
//     Word data;
//     Word addr;
//     Word nextPc;
// } ExecInst;

// // Memory writes
// typedef struct {
//     MemFunc memFunc;
//     Word addr;
//     Word data;
// } MemWriteReq;

Add="Add"
Sub="Sub"
And="And"
Or="Or"
Xor="Xor"
Slt="Slt"
Sltu="Sltu"
Sll="Sll"
Srl="Srl"
Sra="Sra"