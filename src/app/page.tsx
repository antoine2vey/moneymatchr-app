"use client"

import { useAccount, useReadContract, useWatchContractEvent, useWriteContract } from "wagmi";
import { readContract } from "viem/actions";
import { client, MONEYMATCHR, SMASHPROS } from "./config";
import abi from "./abi";
import useToast from "./hooks/useToast";
import { StartForm, StartFormValues } from "./forms/StartForm";
import { MintForm, MintFormValues } from "./forms/MintForm";
import { useEffect, useState } from "react";
import { ZeroAddress, ethers, formatUnits } from "ethers";

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
  const { asyncToast, successToast } = useToast()
  const { data: maxAgreementAttempts } = useReadContract({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    functionName: 'maxAgreementAttempts',
    account: address
  })
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
      setMatches([...data])
    }
  }, [isLoading, data])

  useWatchContractEvent({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    eventName: 'Accept',
    args: { _id: currentMatch?.id || null },
    async onLogs(logs) {
      // Someone accepted this match
    }
  })

  useWatchContractEvent({
    abi: abi.moneymatchr,
    address: MONEYMATCHR,
    eventName: 'Decline',
    args: { _id: currentMatch?.id || null },
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
    if (addr.startsWith('0x00000')) {
      return 'no one'
    }

    return `${addr.slice(0, 6)}..`
  }

  function getOpponent(match: Match) {
    if (address === match.initiator) {
      return match.opponent
    }

    return match.initiator
  }

  function getVote(match: Match) {
    if (address === match.initiator) {
      return match.initiatorAgreement
    }

    return match.opponentAgreement
  }

  function getOpponentVote(match: Match) {
    if (address === match.initiator) {
      return match.opponentAgreement
    }

    return match.initiatorAgreement
  }

  async function accept() {
    if (currentMatch) {
      const approveTx = writeContractAsync({
        abi: abi.smashpros,
        address: SMASHPROS,
        functionName: 'approve',
        account: address,
        args: [MONEYMATCHR, currentMatch.amount]
      })
  
      await asyncToast(approveTx, 'Tokens approved!')
  
      const tx = writeContractAsync({
        abi: abi.moneymatchr,
        address: MONEYMATCHR,
        functionName: 'accept',
        account: address,
        args: [currentMatch.id, currentMatch.amount]
      })
  
      await asyncToast(tx, 'You accepted the match!')

      const updatedMatch = {
        ...currentMatch,
        amount: currentMatch.amount * BigInt(2),
        state: EnumMatch.Started
      }

      setCurrentMatch(updatedMatch)

      setMatches((matches) => {
        return matches.map(match => {
          if (match.id === currentMatch.id) {
            return updatedMatch
          }

          return match
        })
      })
    }
  }

  async function decline() {
    if (currentMatch) {
      const tx = writeContractAsync({
        abi: abi.moneymatchr,
        address: MONEYMATCHR,
        functionName: 'decline',
        account: address,
        args: [currentMatch.id]
      })
  
      await asyncToast(tx, 'You declined to match ❌')

      setMatches(matches => matches.filter(m => m.id !== currentMatch.id))
      setCurrentMatch(null)
    }
  }

  async function agree(on: `0x${string}`) {
    if (currentMatch) {
      const tx = writeContractAsync({
        abi: abi.moneymatchr,
        address: MONEYMATCHR,
        functionName: 'agree',
        account: address,
        args: [currentMatch.id, on]
      })
  
      await asyncToast(tx, `You voted for ${shortenEthAddress(on)}`)
      const isInitiator = address === currentMatch.initiator

      const agreed = () => {
        if (isInitiator) {
          return currentMatch.opponentAgreement === on
        }

        return currentMatch.initiatorAgreement === on
      }

      const won = () => {
        if (agreed()) {
          const neededWins = (currentMatch.maxMatches / BigInt(2)) + BigInt(1)

          if (isInitiator) {
            return currentMatch.initiatorScore + BigInt(1) === neededWins
          }

          return currentMatch.opponentScore + BigInt(1) === neededWins
        }

        return false
      }

      const state = () => {
        if (won()) {
          return EnumMatch.Finished
        }

        if (disputed()) {
          if (currentMatch.attempts + BigInt(1) === maxAgreementAttempts) {
            return EnumMatch.Frozen
          }
        }

        return EnumMatch.Voting
      }

      const winner = () => {
        if (won()) {
          return on
        }

        return ethers.ZeroAddress as `0x${string}`
      }

      const disputed = () => {
        if (isInitiator) {
          if (currentMatch.opponentAgreement === ZeroAddress) {
            return false
          }

          return currentMatch.opponentAgreement !== on
        }

        if (currentMatch.initiatorAgreement === ZeroAddress) {
          return false
        }

        return currentMatch.initiatorAgreement !== on
      }

      const opponentAgreement = () => {
        let opponentAgreement = currentMatch.opponentAgreement

        if (won() || agreed() || disputed()) {
          return ZeroAddress as `0x${string}`
        }

        if (!isInitiator) {
          opponentAgreement = on
        }

        return opponentAgreement
      }

      const initiatorAgreement = () => {
        let initiatorAgreement = currentMatch.initiatorAgreement

        if (won() || agreed() || disputed()) {
          return ZeroAddress as `0x${string}`
        }

        if (isInitiator) {
          initiatorAgreement = on
        }

        return initiatorAgreement
      }

      const initiatorScore = () => {
        let initiatorScore = currentMatch.initiatorScore

        if (agreed()) {
          if (isInitiator) {
            if (on === currentMatch.opponentAgreement) {
              initiatorScore = initiatorScore + BigInt(1)
            }
          } else {
            if (on === currentMatch.initiatorAgreement) {
              initiatorScore = initiatorScore + BigInt(1)
            }
          }
        }

        return initiatorScore
      }

      const opponentScore = () => {
        let opponentScore = currentMatch.opponentScore

        if (agreed()) {
          if (!isInitiator) {
            if (on === currentMatch.opponentAgreement) {
              opponentScore = opponentScore + BigInt(1)
            }
          } else {
            if (on === currentMatch.initiatorAgreement) {
              opponentScore = opponentScore + BigInt(1)
            }
          }
        }

        return opponentScore
      }

      const attempts = () => {
        if (disputed()) {
          return currentMatch.attempts + BigInt(1)
        }

        return currentMatch.attempts
      }

      const updatedMatch: Match = {
        ...currentMatch,
        state: state(),
        winner: winner(),
        attempts: attempts(),
        initiatorAgreement: initiatorAgreement(),
        opponentAgreement: opponentAgreement(),
        initiatorScore: initiatorScore(),
        opponentScore: opponentScore()
      }

      if (won()) {
        if (winner() === address) {
          successToast(`You won, you will shortly receive ${formatUnits(currentMatch.amount, 18)} SMSH tokens!`)
        } else {
          successToast(`You lost.`)
        }
      }

      setCurrentMatch(updatedMatch)

      // setMatches((matches) => {
      //   return matches.map(match => {
      //     if (match.id === currentMatch.id) {
      //       return updatedMatch
      //     }

      //     return match
      //   })
      // })
    }
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
              <h2>Match n°{currentMatch.id.toString()} - {EnumMatch[currentMatch.state]} - BO{currentMatch.maxMatches.toString()}</h2>

              {currentMatch.state === EnumMatch.Sent && getOpponent(currentMatch) === currentMatch.initiator && (
                <>
                  <button className="border border-black px-4 py-1" onClick={accept}>accept</button>{' '}
                  <button className="border border-black px-4 py-1" onClick={decline}>decline</button>
                </>
              )}

              {!currentMatch.winner.startsWith('0x00000') && (
                <p>Winner: {currentMatch.winner}</p>
              )}
              <br />
              <p>Opponent: {shortenEthAddress(getOpponent(currentMatch))}..</p>
              <p>Amount: {ethers.formatUnits(currentMatch.amount, 18)} SMSH</p>
              <br />
              <p>Score:</p>
              <p>
                <button onClick={() => agree(currentMatch.initiator)}>{shortenEthAddress(currentMatch.initiator)}</button>{' '}
                <span className="text-xl font-bold">{currentMatch.initiatorScore.toString()}</span>
                {' '}-{' '}
                <span className="font-bold text-xl">{currentMatch.opponentScore.toString()}</span>{' '}
                <button onClick={() => agree(currentMatch.opponent)}>{shortenEthAddress(currentMatch.opponent)}</button>
              </p>
              <br />
              <p>Votes: (attempts: {currentMatch.attempts.toString()})</p>
              <p>You voted {shortenEthAddress(getVote(currentMatch))}</p>
              <p>Your opponent voted {shortenEthAddress(getOpponentVote(currentMatch))}</p>
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