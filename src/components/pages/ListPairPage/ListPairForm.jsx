import React, { useCallback, useEffect, useState } from "react";
import { x } from "@xstyled/styled-components";
import { Toggle, QuestionHelper } from "components";
import NumberInput from "../../atoms/Form/NumberInput";
import { model } from "../../atoms/Form/helpers";
import styled from "styled-components";
import axios from "axios";
import { useTranslation } from "react-i18next";

import {
  forceValidation,
  max,
  min,
  required,
} from "../../atoms/Form/validation";
import SelectInput from "../../atoms/Form/SelectInput";
import { Button } from "../../atoms/Form/Submit";
import TextInput from "../../atoms/Form/TextInput";
import Form from "../../atoms/Form/Form";
import { TRADING_VIEW_CHART_KEY } from "./ListPairPage";
import { debounce } from "lodash";
import useTheme from "components/hooks/useTheme";

const ListPairContainer = styled.div`
  margin-top: 10px;
  padding: 1rem 18px;
  border: 1px solid ${(p) => p.theme.colors.foreground400};
  border-radius: 8px;
  margin-bottom: 20px;

  .custom-form-label {
    margin-bottom: 5px;
  }

  form {
    display: flex;
    padding: 3vh 18px;
    min-height: 50vh;
    flex-direction: column;
    justify-content: space-between;
  }
`;

const ListPairForm = ({ onSubmit, children }) => {
  const [baseAssetId, setBaseAssetId] = useState("");
  const [quoteAssetId, setQuoteAssetId] = useState("");
  const [baseFee, setBaseFee] = useState("");
  const [quoteFee, setQuoteFee] = useState("");
  const [basePrice, setBasePrice] = useState(null);
  const [quotePrice, setQuotePrice] = useState(null);
  const [baseSymbol, setBaseSymbol] = useState(null);
  const [quoteSymbol, setQuoteSymbol] = useState(null);
  const [isBaseAssetIdInvalid, setIsBaseAssetIdInvalid] = useState(false);
  const [isQuoteAssetIdInvalid, setIsQuoteAssetIdInvalid] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [zigZagChainId, setZigZagChainId] = useState(1);
  const { isDark } = useTheme();
  const isMobile = window.innerWidth < 500;
  const { t } = useTranslation();

  const getTokenInfo = async (
    assetId,
    chainId,
    priceSetter,
    feeSetter,
    symbolSetter,
    isInvalidSetter
  ) => {
    console.log(`assetId ==> ${assetId}`);
    if (assetId && assetId !== "") {
      try {
        const { symbol } = (
          await axios.get(`https://api.zksync.io/api/v0.2/tokens/${assetId}`)
        ).data.result;
        const { price: apiPrice } = (
          await axios.get(
            `https://api.zksync.io/api/v0.2/tokens/${assetId}/priceIn/usd`
          )
        ).data.result;
        if (symbol) {
          symbolSetter(symbol);
          isInvalidSetter(false);

          try {
            const price = Number(apiPrice);
            if (price === 0) {
              throw Error(`${symbol} price came back as 0`);
            }
            priceSetter(price);
            feeSetter(getAmountForTargetNotional(price));
          } catch (e) {
            feeSetter("");
            priceSetter(null);
          }
        }
      } catch (e) {
        symbolSetter(null);
        isInvalidSetter(true);
        feeSetter("");
        priceSetter(null);
      }
    } else {
      symbolSetter(null);
      priceSetter(null);
    }
  };

  const getBaseInfo = (assetId, zigzagId) =>
    getTokenInfo(
      assetId,
      zigzagId,
      setBasePrice,
      setBaseFee,
      setBaseSymbol,
      setIsBaseAssetIdInvalid
    );
  const queryBaseTokenInfo = useCallback(debounce(getBaseInfo, 500), []);
  useEffect(() => {
    queryBaseTokenInfo(baseAssetId, zigZagChainId);
  }, [baseAssetId, zigZagChainId]);

  const getQuoteInfo = (assetId, zigzagId) =>
    getTokenInfo(
      assetId,
      zigzagId,
      setQuotePrice,
      setQuoteFee,
      setQuoteSymbol,
      setIsQuoteAssetIdInvalid
    );
  const queryQuoteTokenInfo = useCallback(debounce(getQuoteInfo, 500), []);
  useEffect(() => {
    queryQuoteTokenInfo(quoteAssetId, zigZagChainId);
  }, [quoteAssetId, zigZagChainId]);

  const renderFeeHint = (assetPrice, assetFee, symbol, feeSetter) => {
    if (assetPrice) {
      const notional = (Number(assetPrice) * Number(assetFee)).toFixed(2);
      if (notional > 0) {
        return (
          <x.div
            pl={2}
            fontSize={12}
            color={"blue-gray-500"}
            mt={1}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <x.div style={{ wordBreak: "break-all" }}>
              {assetFee} {symbol} = ${notional}
            </x.div>
            {notional > 1 && (
              <x.div>
                <Button
                  ml={1}
                  variant={"secondary"}
                  size={"xs"}
                  onClick={() =>
                    feeSetter(getAmountForTargetNotional(assetPrice))
                  }
                >
                  {t("set_to_1")}
                </Button>
                <x.div />
              </x.div>
            )}
          </x.div>
        );
      }
    }
    return null;
  };

  return (
    <ListPairContainer>
      <PairPreview
        baseAssetId={baseAssetId}
        quoteAssetId={quoteAssetId}
        baseSymbol={baseSymbol}
        quoteSymbol={quoteSymbol}
      />
      <Form
        initialValues={{
          baseAssetId: baseAssetId,
          quoteAssetId: quoteAssetId,
          baseFee: baseFee,
          quoteFee: quoteFee,
          zigzagChainId: zigZagChainId,
          pricePrecisionDecimals: "",
          [TRADING_VIEW_CHART_KEY]: "",
        }}
        onSubmit={onSubmit}
      >
        <x.div
          display={"grid"}
          gridTemplateColumns={isMobile ? 1 : 2}
          rowGap={21}
          columnGap={24}
          mb={16}
          alignItems="flex-start"
        >
          <x.div>
            <NumberInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              block
              {...model(baseAssetId, setBaseAssetId)}
              label={
                <x.span fontSize={{ xs: "xs", md: "14px" }} col>
                  {t("base_asset")}{" "}
                  <x.a
                    color={{ _: "blue-gray-500", hover: "primaryHighEmphasis" }}
                    target={"_blank"}
                    href={
                      zigZagChainId === 1
                        ? "https://zkscan.io/explorer/tokens"
                        : "https://rinkeby.zkscan.io/explorer/tokens"
                    }
                  >
                    {t("internal_id")}
                  </x.a>
                </x.span>
              }
              name={"baseAssetId"}
              fontSize={14}
              borderRadius={8}
              validate={[
                required,
                min(0),
                forceValidation(
                  isBaseAssetIdInvalid,
                  "invalid asset on zksync"
                ),
              ]}
              rightOfLabel={
                <QuestionHelper
                  text={t("zksync_token_id_of_the_first_asset")}
                  placement={"top"}
                ></QuestionHelper>
              }
            />
          </x.div>

          <x.div>
            <NumberInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              block
              {...model(quoteAssetId, setQuoteAssetId)}
              label={
                <x.span fontSize={{ xs: "xs", md: "14px" }}>
                  {t("quote_asset")}{" "}
                  <x.a
                    color={{ _: "blue-gray-500", hover: "primaryHighEmphasis" }}
                    target={"_blank"}
                    href={
                      zigZagChainId === 1
                        ? "https://zkscan.io/explorer/tokens"
                        : "https://rinkeby.zkscan.io/explorer/tokens"
                    }
                  >
                    {t("internal_id")}
                  </x.a>
                </x.span>
              }
              name={"quoteAssetId"}
              fontSize={14}
              borderRadius={8}
              validate={[
                required,
                min(0),
                forceValidation(
                  isQuoteAssetIdInvalid,
                  "invalid asset on zksync"
                ),
              ]}
              rightOfLabel={
                <QuestionHelper
                  text={t("zksync_token_id_of_the_second_asset")}
                  placement="top"
                ></QuestionHelper>
              }
            />
          </x.div>
          <x.div>
            <NumberInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              block
              name={"baseFee"}
              fontSize={14}
              borderRadius={8}
              {...model(baseFee, setBaseFee)}
              label={
                baseSymbol ? (
                  <x.span fontSize={{ xs: "xs", md: "14px" }}>
                    {baseSymbol} {t("swap_fee")}
                  </x.span>
                ) : (
                  <x.span fontSize={{ xs: "xs", md: "14px" }}>
                    {t("base_swap_fee")}
                  </x.span>
                )
              }
              validate={[required, min(0)]}
              rightOfLabel={
                <QuestionHelper
                  text={t("swap_fee_collected_by_market_makers")}
                  placement={isMobile ? "top" : "left"}
                ></QuestionHelper>
              }
            />
            {renderFeeHint(basePrice, baseFee, baseSymbol, setBaseFee)}
          </x.div>
          <x.div>
            <NumberInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              block
              fontSize={14}
              borderRadius={8}
              name={"quoteFee"}
              {...model(quoteFee, setQuoteFee)}
              label={
                quoteSymbol ? (
                  <x.span fontSize={{ xs: "xs", md: "14px" }}>
                    {quoteSymbol} {t("swap_fee")}
                  </x.span>
                ) : (
                  <x.span fontSize={{ xs: "xs", md: "14px" }}>
                    {t("quote_swap_fee")}
                  </x.span>
                )
              }
              validate={[required, min(0)]}
              rightOfLabel={
                <QuestionHelper
                  text={t("swap_fee_collected_by_market_makers")}
                  placement={isMobile ? "top" : "right"}
                ></QuestionHelper>
              }
            />
            {renderFeeHint(quotePrice, quoteFee, quoteSymbol, setQuoteFee)}
          </x.div>
          <x.div>
            <NumberInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              block
              fontSize={14}
              borderRadius={8}
              name={"pricePrecisionDecimals"}
              label={
                <x.span fontSize={{ xs: "xs", md: "14px" }}>
                  {t("price_precision_decimals")}
                </x.span>
              }
              validate={[required, max(10), min(0)]}
              rightOfLabel={
                <QuestionHelper
                  text={
                    <>
                      <x.div>
                        {t(
                          "number_of_decimal_places_in_the_price_of_the_asset_pair"
                        )}
                      </x.div>

                      <x.div
                        display={"grid"}
                        gridTemplateColumns={2}
                        mt={2}
                        gap={0}
                      >
                        <x.div>{t("ex_eth_usdc_has_2")}</x.div>
                        <x.div>($3250.61)</x.div>
                        <x.div>{t("ex_eth_wbtc_has_6")}</x.div>
                        <x.div>(0.075225)</x.div>
                      </x.div>
                    </>
                  }
                  placement={isMobile ? "top" : "bottom"}
                ></QuestionHelper>
              }
            />
          </x.div>
          <x.div>
            <SelectInput
              className={`rounded-lg ${
                isDark
                  ? "bg-foreground-200 hover:ring-foreground-500"
                  : "bg-primary-300 hover:ring-primary-600"
              } hover:ring-1 hover:ring-offset-0`}
              fontSize={14}
              padding={5}
              borderRadius={8}
              {...model(zigZagChainId, setZigZagChainId)}
              name={"zigzagChainId"}
              label={
                <x.span fontSize={{ xs: "xs", md: "14px" }}>
                  {t("network")}
                </x.span>
              }
              items={[
                { name: "zkSync 1.0 - Mainnet", id: 1 },
              //  { name: "zkSync - Goerli", id: 1002 },
              ]}
              validate={required}
              rightOfLabel={
                <QuestionHelper
                  text={t("zksync_network_on_which_the_pair_will_be_listed")}
                  placement={isMobile ? "top" : "right"}
                ></QuestionHelper>
              }
            />
          </x.div>
        </x.div>

        <x.div
          h={"1px"}
          w={"full"}
          bg={"blue-gray-800"}
          borderRadius={10}
          mb={21}
        />

        <x.div display={"flex"} alignItems={"center"} mb={21}>
          <Toggle
            scale="md"
            font="primarySmall"
            leftLabel={t("advanced_settings")}
            onChange={() => setShowAdvancedSettings(!showAdvancedSettings)}
          />
        </x.div>
        <x.div
          display={"grid"}
          gridTemplateColumns={isMobile ? 1 : 2}
          rowGap={21}
          columnGap={24}
          mb={16}
          alignItems="flex-end"
        >
          <x.div>
            {showAdvancedSettings && (
              <TextInput
                className={`rounded-lg ${
                  isDark
                    ? "bg-foreground-200 hover:ring-foreground-500"
                    : "bg-primary-300 hover:ring-primary-600"
                } hover:ring-1 hover:ring-offset-0`}
                block
                fontSize={14}
                padding={5}
                borderRadius={8}
                name={TRADING_VIEW_CHART_KEY}
                label={
                  <x.span fontSize={{ xs: "xs", md: "14px" }}>
                    {t("default_chart_ticker")}
                  </x.span>
                }
                rightOfLabel={
                  <QuestionHelper
                    text={
                      <div>
                        <x.div>
                          {t(
                            "default_tradingview_chart_to_be_seen_on_the_trade_page"
                          )}
                        </x.div>
                        <x.div mt={2}>
                          ({t("ex_show_coinbase_btcusd_for_wbtc_usd")})
                        </x.div>
                      </div>
                    }
                  ></QuestionHelper>
                }
              />
            )}
          </x.div>
        </x.div>
        {children}
      </Form>
    </ListPairContainer>
  );
};

const PairPreview = ({
  baseAssetId,
  quoteAssetId,
  baseSymbol,
  quoteSymbol,
}) => {
  const isMobile = window.innerWidth < 500;

  return (
    <>
      {(baseAssetId || quoteAssetId) && (
        <x.div
          display={"flex"}
          fontSize={isMobile ? 24 : 35}
          justifyContent={"center"}
          my={4}
        >
          <x.span color={baseSymbol ? "blue-gray-400" : "blue-gray-800"}>
            {baseSymbol ? baseSymbol : "XXX"}
          </x.span>
          <x.span
            color={
              baseSymbol && quoteSymbol ? "blue-gray-400" : "blue-gray-800"
            }
          >
            /
          </x.span>
          <x.span color={quoteSymbol ? "blue-gray-400" : "blue-gray-800"}>
            {quoteSymbol ? quoteSymbol : "XXX"}
          </x.span>
        </x.div>
      )}
    </>
  );
};

// const QuestionHelper = ({ children }) => {
//   return (
//     <Tooltip placement={"right"} label={children}>
//       <x.div
//         color={"blue-gray-600"}
//         ml={-13}
//         alignItems={"center"}
//       >
//         <BsExclamationCircle size={10} color={"primaryHighEmphasis"} />
//       </x.div>
//     </Tooltip>
//   );
// };

const getAmountForTargetNotional = (price) => {
  const targetUSDFeeAmount = 1;
  return (targetUSDFeeAmount / price).toFixed(6);
};

export default ListPairForm;
