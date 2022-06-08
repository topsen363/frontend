import React, { useState, cloneElement, isValidElement, useRef } from 'react'
import styled from 'styled-components'
import { ExpandableButton } from '../ExpandableButton'
import { IconButton as baseIcon } from "../IconButton";
import Text from '../../atoms/Text/Text'
import { HideMenuOnOutsideClicked } from 'lib/utils'

const DropdownWrapper = styled.div`
    position: relative;

    &.size-wide {
        position: static;
    }
`

export const Wrapper = styled.div`
    position: absolute;
    // min-width: ${({ width }) => `${width}px`};
    width: 100%;
    background-color: ${({ theme }) => theme.colors.backgroundMediumEmphasis};
    border: 1px solid ${({ theme }) => theme.colors.foreground400};
    box-shadow: 0px 8px 16px 0px #0101011A;
    backdrop-filter: blur(8px);
    padding: 16px 7px;
    border-radius: 8px;
    display: grid;
    gap: 10px;
    align-items: start;
    z-index: 100;

    &.network-dropdown {
        &.mobile-mode {
            padding: 16px;
        }
    
        .selected-icon {
            padding-left: 30px;
            grid-template-columns: max-content;
        }
    }

    &.side-dropdown {
        padding: 8px 0;
        gap: 0;
    }

    &.lang-dropdown {
        padding: 16px 0px 16px 16px;
        margin-left: -8px;
        width: auto;
    }
`

const DropdownListContainer = styled.div`
    display: grid;
    // grid-auto-flow: column;
    // height: 31px;
    align-items: center;
    grid-template-columns: ${({ leftIcon }) => leftIcon ? '32px 1fr' : '1fr 16px'};
    cursor: pointer;

    &.side-dropdown {
        padding: 8px 1rem;

        &:hover, &.active {
            background-color: ${({ theme }) => theme.colors.backgroundLowEmphasis}
        }
    }
`

const IconButton = styled(baseIcon)`
    width: 24px;
    height: 24px;
    background: transparent;
    border-radius: 9999px;
    padding: 0px !important;
    svg {
        margin-right: 0px !important;
        margin-left: 0px !important;
    }

    &:not(.network-dropdown) {
        border: 1px solid ${({ theme }) => theme.colors.foreground400};
    }

    &.network-dropdown path {
        fill: ${(p) => p.theme.colors.foregroundHighEmphasis};
    }
`

const Dropdown = ({ width, item, context, leftIcon, rightIcon, transparent, clickFunction, isMobile = false, adClass = "" }) => {
    const [isOpened, setIsOpened] = useState(false)
    const wrapperRef = useRef(null)

    HideMenuOnOutsideClicked(wrapperRef, setIsOpened)

    const toggle = () => {
        setIsOpened(!isOpened)
    }

    const handleClick = (url, text, value) => {
        if (url !== '#') {
            window.location.href = url
        } else {
            clickFunction(text, value)
            toggle()
        }
    }

    return (
        <DropdownWrapper ref={wrapperRef} className={adClass}>
            <ExpandableButton width={width} transparent={transparent} expanded={isOpened} onClick={toggle}>{context}</ExpandableButton>
            {isOpened &&
                <Wrapper width={width} className={`${adClass} ${isMobile ? "mobile-mode" : ""}`} >
                    {item.map((items) => {
                        const { text, value, url, icon, selectedIcon, iconSelected } = items
                        const menuIcon = iconSelected ? selectedIcon : icon;
                        return (
                            <DropdownListContainer className={`${adClass} ${iconSelected ? "active" : ""}`} key={items.text} leftIcon={leftIcon} onClick={() => handleClick(url, text, value)}>
                                {leftIcon && isValidElement(menuIcon) && <IconButton className={adClass} variant="secondary" startIcon={cloneElement(menuIcon)}></IconButton>}
                                <Text font="primaryExtraSmallSemiBold" color="foregroundHighEmphasis" className={!iconSelected ? "selected-icon" : ""}>{text}</Text>
                                {rightIcon && isValidElement(menuIcon) && <IconButton className={adClass} variant="secondary" endIcon={cloneElement(menuIcon)}></IconButton>}
                            </DropdownListContainer>
                        )
                    })}
                </Wrapper>
            }
        </DropdownWrapper >
    )
}

export default Dropdown