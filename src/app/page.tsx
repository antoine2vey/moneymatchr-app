"use client"

import { useAccount, useReadContract, useWatchContractEvent, useWriteContract } from "wagmi";
import { readContract } from "viem/actions";
import { client, MONEYMATCHR, SMASHPROS } from "./config";
import abi from "./abi";
import useToast from "./hooks/useToast";
import { StartForm, StartFormValues } from "./forms/StartForm";
import { MintForm, MintFormValues } from "./forms/MintForm";

export default function Home() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { asyncToast } = useToast()
  
  useWatchContractEvent({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    eventName: 'Send',
    args: { _to: address },
    async onLogs(logs) {
      const tx = readContract(client, {
        abi: abi.moneymatchr,
        address: MONEYMATCHR,
        functionName: 'getMatch',
        args: [logs[0].args._id!]
      })

      asyncToast(tx, 'New match waiting for you!')
    }
  })

  async function mint({ amount, to }: MintFormValues) {     
   const tx = writeContractAsync({
      abi: abi.smashpros,
      address: SMASHPROS,
      functionName: 'mint',
      args: [to, BigInt(amount * 1e18)],
    })

    asyncToast(tx, 'Successful mint!')
  }

  async function start({ opponent, amount, maxMatches }: StartFormValues) {
    const txs = Promise.all([
      writeContractAsync({
        abi: abi.smashpros,
        address: SMASHPROS,
        functionName: 'approve',
        args: [MONEYMATCHR, BigInt(10000 * 1e18)]
      }),
      writeContractAsync({
        abi: abi.moneymatchr,
        address: MONEYMATCHR,
        functionName: 'start',
        args: [opponent, BigInt(amount * 1e18), BigInt(maxMatches)]
      })
    ])

    asyncToast(txs, 'Match started!')
  }

  return (
    <div className="bg-gray-800 w-screen h-screen flex">
      <div className="absolute top-2 right-2">
        <w3m-button />
        {isConnected && <MintForm onSubmit={mint} />}
      </div>

      <div className="w-screen h-screen flex items-center justify-center">
        <div className="bg-gray-700 p-12 rounded-2xl">
          <h1 className="font-bold text-white text-4xl">Moneymatchr</h1>

          <StartForm onSubmit={start} />
        </div>
      </div>
    </div>
  )
}