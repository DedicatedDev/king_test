import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import {} from "@king/contracts-typechain";
import { Settings, KingABI } from "@king/contracts-typechain";
import { ethers } from "ethers";
import classNames from "classnames";
import { AppStatus } from "../model/AppStatus";
import { useModal } from "react-modal-hook";
import ReactModal from "react-modal";

const kingConfig = {
  addressOrName: Settings.king,
  contractInterface: KingABI.abi,
};
export function KingBoard() {
  const [isLoading, setLoading] = useState(false);
  const [kingInfo, setKingInfo] = useState({
    king: ethers.constants.AddressZero,
    price: 0,
    ratio: 150,
  });
  const [challengeValue, setChallengeValue] = useState(0);
  const [errMsg, setError] = useState("");
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.OFF);

  const account = useAccount();

  const { data: currentKingInfo, refetch: getCurrentKing } = useContractRead({
    ...kingConfig,
    functionName: "getCurrentKing",
    args: [ethers.constants.AddressZero],
    watch: true,
  });

  useEffect(() => {
    if (account.address === undefined) {
      setAppStatus(AppStatus.OFF);
    } else if (account.address === kingInfo.king) {
      setAppStatus(AppStatus.KING);
    } else {
      setAppStatus(AppStatus.CHALLENGE);
    }
  }, [account.address, kingInfo.king]);

  useEffect(() => {
    if (currentKingInfo !== undefined) {
      setKingInfo({
        king: currentKingInfo[0],
        price: currentKingInfo[1].toString(),
        ratio: currentKingInfo[2],
      });
      const winValue = (kingInfo.price * kingInfo.ratio) / 100;
      setChallengeValue(winValue !== 0 ? +ethers.utils.formatEther(winValue).toString() : 0.001);
    }
  }, [currentKingInfo]);

  //Challenge Mode
  const { config: challengeWriteConfig, refetch: reSetupConfig } = usePrepareContractWrite({
    ...kingConfig,
    functionName: "depositETH",
    overrides: { value: ethers.utils.parseEther(challengeValue.toString()) },
  });
  const { writeAsync: challengeAsync, error: challengeError } = useContractWrite(challengeWriteConfig);

  const challenge = async () => {
    setLoading(true);
    if (challengeAsync != undefined) {
      try {
        await challengeAsync();
        await getCurrentKing();
        setError("Transaction is submitted!");
      } catch (error) {
        setError("Transaction failed!");
        showModal();
      }
    } else {
      setError("Does not meet challenge condition!");
      showModal();
    }
    setLoading(false);
  };

  //Modal

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
    },
  };
  const [showModal, hideModal] = useModal(
    () => (
      <ReactModal
        isOpen
        onRequestClose={hideModal}
        shouldCloseOnOverlayClick={true}
        overlayClassName="Overlay"
        closeTimeoutMS={100}
        style={customStyles}
      >
        <div className="bg-transparent ">
          <div className="flex justify-between bg-gray-50/10">
            <div className="text-2xl font-bold text-red-600">Alert</div>
            <div className="text-3xl cursor-pointer select-none active:bg-gray-50/10" onClick={hideModal}>
              ✕
            </div>
          </div>
          <div className="px-12 py-6 text-base text-red-600">{errMsg}</div>
        </div>
      </ReactModal>
    ),
    []
  );

  const buildStatusCard = () => {
    switch (appStatus) {
      case AppStatus.CHALLENGE:
        return isLoading ? (
          <div> Processing Transaction....</div>
        ) : (
          <div className={classNames("flex justify-center gap-10", isLoading ? "hidden" : "block")}>
            <div
              className="px-12 py-5 text-xl text-white bg-red-700 cursor-pointer select-none active:bg-green-300 rounded-xl"
              onClick={challenge}
            >
              Challenge
            </div>
          </div>
        );
      case AppStatus.KING:
        return <div className={classNames("text-xl font-bold text-red-600")}>You are already king!</div>;
      case AppStatus.OFF:
        return <div className={classNames("text-xl font-bold text-red-600")}>You did not connect wallet!</div>;
      default:
        return <></>;
    }
  };

  return (
    <div className="px-12 py-5 text-center ">
      <div className="p-5 text-left border-2 rounded-xl">
        <div className="flex justify-between">
          <p className="text-center">King Info</p>
        </div>
        <div className="mt-5 border-t-2"></div>
        {kingInfo.king == ethers.constants.AddressZero ? (
          <div className="mt-10 text-center text-red-600"> There is no King still</div>
        ) : (
          <div className="grid grid-cols-2 gap-5 mt-5">
            <p>King Address:</p>
            <p>{kingInfo.king}</p>
            <p>Price:</p>
            <p>{ethers.utils.formatEther(kingInfo.price.toString())} ETH</p>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-5 px-12 py-4">
        <div className="flex items-center gap-2">
          <p>Amount:</p>
          <input
            className="w-full px-4 py-2 leading-tight text-gray-700 bg-gray-200 border-2 border-gray-200 rounded appearance-none focus:outline-none focus:bg-white focus:border-purple-500"
            id="challenge_amount"
            type="number"
            value={+challengeValue}
            onChange={(e) => {
              setChallengeValue(+e.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center gap-10 ">{buildStatusCard()}</div>
    </div>
  );
}
