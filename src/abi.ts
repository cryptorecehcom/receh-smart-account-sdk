// src/abi.ts

export const ENTRYPOINT_ABI = [
  "function getUserOpHash((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,address paymaster,bytes paymasterData,bytes signature) userOp) view returns (bytes32)",
  "function handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,address paymaster,bytes paymasterData,bytes signature)[] ops,address payable beneficiary)",
  "function deposits(address) view returns (uint256 balance)",
] as const;

export const FACTORY_ABI = [
  "function getAccountAddress(address owner, uint256 salt) view returns (address)",
  "function createAccount(address owner, uint256 salt) returns (address)",
  "function entryPoint() view returns (address)",
] as const;

export const ACCOUNT_ABI = [
  "function owner() view returns (address)",
  "function entryPoint() view returns (address)",
  "function nonce() view returns (uint256)",
  "function execute(address target, uint256 value, bytes data)",
  "function executeOwner(address target, uint256 value, bytes data)",
] as const;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
] as const;