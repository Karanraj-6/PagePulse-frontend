import { FC } from 'react';

interface InfiniteMenuItem {
    image: string;
    link: string;
    title: string;
    description?: string;
    unread?: boolean;
    hasNewMessage?: boolean;
}

interface InfiniteMenuProps {
    items: InfiniteMenuItem[] | any[];
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
    scale?: number;
    forceScrollTrigger?: any;
}

declare const InfiniteMenu: FC<InfiniteMenuProps>;

export default InfiniteMenu;
