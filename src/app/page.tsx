"use client"

import { useAccount, useReadContract, useWatchContractEvent, useWriteContract } from "wagmi";
import { readContract } from "viem/actions";
import { client, MONEYMATCHR, SMASHPROS } from "./config";
import abi from "./abi";
import useToast from "./hooks/useToast";
import { StartForm, StartFormValues } from "./forms/StartForm";
import { MintForm, MintFormValues } from "./forms/MintForm";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

enum EnumMatch {
  Sent, Started, Voting, Finished, Frozen, Disputed
}

type Match = {
  id: bigint
  initiator: `0x${string}`,
  opponent: `0x${string}`,
  winner: `0x${string}`,
  amount: bigint,
  maxMatches: bigint,
  initiatorScore: bigint,
  opponentScore: bigint,
  initiatorAgreement: `0x${string}`,
  opponentAgreement: `0x${string}`,
  attempts: bigint,
  frozen: boolean,
  state: number
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { asyncToast } = useToast()
  const { data, isLoading } = useReadContract({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    functionName: 'getMatchs',
    account: address
  })

  const { data: owner } = useReadContract({
    abi: abi.smashpros,
    address: SMASHPROS,
    functionName: 'owner',
    account: address
  })

  useEffect(() => {
    if (!isLoading && data) {
      console.log(data)
      setMatches([...data])
    }
  }, [isLoading, data])

  useWatchContractEvent({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    eventName: 'Accept',
    args: { _id: currentMatch?.id },
    async onLogs(logs) {
      // Someone accepted this match
    }
  })

  useWatchContractEvent({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    eventName: 'Decline',
    args: { _id: currentMatch?.id },
    async onLogs(logs) {
      // Someone declined this match
    }
  })
  
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
      account: address,
      args: [to, BigInt(amount * 1e18)],
    })

    asyncToast(tx, 'Successful mint!')
  }

  async function start({ opponent, amount, maxMatches }: StartFormValues) {
    const approveTx = writeContractAsync({
      abi: abi.smashpros,
      address: SMASHPROS,
      functionName: 'approve',
      account: address,
      args: [MONEYMATCHR, BigInt(amount * 1e18)]
    })

    await asyncToast(approveTx, 'Tokens approved!')

    const tx = writeContractAsync({
      abi: abi.moneymatchr,
      address: MONEYMATCHR,
      functionName: 'start',
      account: address,
      args: [opponent, BigInt(amount * 1e18), BigInt(maxMatches)]
    })

    await asyncToast(tx, 'You sent a request!')
  }

  function shortenEthAddress(addr: `0x${string}`) {
    return `${addr.slice(0, 6)}..`
  }

  function getOpponent(match: Match) {
    if (address === match.initiator) {
      return match.opponent
    }

    return match.initiator
  }

  return (
    <div className="w-screen h-screen">
      <div className="absolute top-2 right-2">
        <w3m-button />
        {
          isConnected &&
          owner === address &&
          <MintForm onSubmit={mint} />
        }
      </div>

      <div className="w-screen h-screen flex">
        <div className="min-w-[20%] p-3">
          <h2>Matches</h2>
          <ul>
            {matches.map(match => 
              <li key={match.id.toString()}>
                <button onClick={() => setCurrentMatch(match)}>
                  match n°{match.id.toString()} vs {shortenEthAddress(getOpponent(match))}
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className="flex-1 p-3">
          {currentMatch && (
            <>
              <h2>Match n°{currentMatch.id.toString()} - {EnumMatch[currentMatch.state]}</h2>
              <p>Opponent: {shortenEthAddress(getOpponent(currentMatch))}..</p>
              <p>Amount: {ethers.formatUnits(currentMatch.amount, 18)} SMSH</p>
              <br />
              <p>Score:</p>
              <p>
                {shortenEthAddress(currentMatch.initiator)}..{' '}
                <span className="text-xl font-bold">{currentMatch.initiatorScore.toString()}</span>
                {' '}-{' '}
                <span className="font-bold text-xl">{currentMatch.opponentScore.toString()}</span>{' '}
                {shortenEthAddress(currentMatch.opponent)}..
              </p>
            </>
          )}
        {/* <div className="bg-gray-700 p-12 rounded-2xl">
          <h1 className="font-bold text-white text-4xl">Moneymatchr</h1>

          <StartForm onSubmit={start} />
        </div> */}
        </div>
      </div>
    </div>
  )
}