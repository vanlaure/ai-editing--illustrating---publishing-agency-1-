








import React from 'react';

const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M14.29 14.29H10.14a2.14 2.14 0 0 1-2.14-2.14V6h4.29a2.14 2.14 0 0 1 2.14 2.14v4a2.14 2.14 0 0 1-2.14 2.14Z" /><path d="M6 12h4.14" /><path d="M6 6h2.14" /><path d="M6 18h4.14" /><path d="M10.14 18H15a2.14 2.14 0 0 0 2.14-2.14v-4a2.14 2.14 0 0 0-2.14-2.14h-4.86" /></Icon>
);
export const ItalicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" /></Icon>
);
export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" x2="20" y1="20" y2="20" /></Icon>
);
export const StrikethroughIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" x2="20" y1="12" y2="12" /></Icon>
);
export const Heading1Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="m17 12 3-2v8" /></Icon>
);
export const Heading2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" /></Icon>
);
export const ListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></Icon>
);
export const ListOrderedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="10" x2="21" y1="6" y2="6" /><line x1="10" x2="21" y1="12" y2="12" /><line x1="10" x2="21" y1="18" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Icon>
);
export const QuoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-1.5-2.5C7.75 2 7 2.25 7 2.25S6.25 2 5.5 2.5C4.75 3 4 3.75 4 5v6c0 7 4 8 7 8Z" /><path d="M13 21c3 0 7-1 7-8V5c0-1.25-.75-2-1.5-2.5C17.75 2 17 2.25 17 2.25S16.25 2 15.5 2.5C14.75 3 14 3.75 14 5v6c0 7 4 8 7 8Z" /></Icon>
);
export const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></Icon>
);
export const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></Icon>
);
export const MaximizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></Icon>
);
export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></Icon>
);
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
);
export const UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></Icon>
);
export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></Icon>
);
export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></Icon>
);
export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
);
export const PrinterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></Icon>
);
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>
);
export const TargetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></Icon>
);
export const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>
);
export const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>
);
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z" /></Icon>
);
export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>
);
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>
);
export const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Icon>
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>
);
export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path d="m18 15-6-6-6 6" /></Icon>
);


export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>
);

export const BookCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v16H6.5a2.5 2.5 0 0 1 0-5H20"/>
        <path d="m16 10 2 2 4-4"/>
    </Icon>
);

export const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        <path d="m9 12 2 2 4-4"/>
    </Icon>
);

export const Volume2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></Icon>
);

export const BookUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v16H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M12 13V7" /><path d="m9 10 3-3 3 3" /></Icon>
);

export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><polygon points="5 3 19 12 5 21 5 3" /></Icon>
);

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></Icon>
);

export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></Icon>
);

export const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon>
);

export const FileUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></Icon>
);

export const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 2a10 10 0 0 0-4.3 19.42" /><path d="M12 2a10 10 0 0 1 4.3 19.42" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="m17.66 6.34-1.41-1.41" /><path d="m4.93 19.07 1.41-1.41" /><path d="M12 8a4 4 0 1 0 4 4" /><path d="M16 12h.01" /><path d="M15 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M9 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M9 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /><path d="M15 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></Icon>
);

export const VwaLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props} viewBox="0 0 24 24">
        {/* Pen nib main shape */}
        <path d="M5 15.5L12 3L19 15.5C19 15.5 16.5 21 12 21C7.5 21 5 15.5 5 15.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Slit in the nib, with a circuit feel */}
        <path d="M12 17V12" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="10" r="1.5" strokeWidth="1.5"/>
        <path d="M10 7L8 5" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 7L16 5" strokeWidth="1.5" strokeLinecap="round"/>
    </Icon>
);

export const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Icon>
);

export const TwitterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 3.3 4.9 3.3 4.9-6.1 1.4-14.4 3.4-14.4 3.4-1.1 0-2.3.5-3.4 1.2 2.2-1.2 4.5-3.6 4.5-3.6-2.5 1-8.2 2.8-8.2 2.8-2.3 0-4.5-2.3-4.5-2.3s2.8-.2 4.5-.8c-2.3-.8-4.5-2-4.5-2s1.4.2 2.3.2c-2.3-.5-4.5-1.4-4.5-1.4s1.6.2 2.8.5c-2-1.1-3.6-2.3-3.6-2.3s2.3.5 4.1 1.4c-1.6-.8-2.8-1.6-2.8-1.6s3.1 1.9 6.4 3.1c-1.4-4-1.4-4.5 1.6-4.5z"/></Icon>
);

export const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></Icon>
);

export const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></Icon>
);

export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></Icon>
);

export const UserPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></Icon>
);

export const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>
);

export const GemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M12 22 6 9l-4-6h12Z"/><path d="M12 22 18 9l4-6H6Z"/></Icon>
);

export const ClapperboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m3.1 11.2 13 5.2c1.1.4 2.3-.1 2.7-1.2l2-5.1c.4-1.1-.1-2.3-1.2-2.7L6.1 2.2"/><path d="m6.2 2.5 11.6 4.2"/><path d="m3.5 12.8 11.6 4.3"/><path d="M8 12V2l-5 2"/></Icon>
);

export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></Icon>
);

export const ShieldQuestionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Icon>
);

export const MessageSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>
);

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9a3 3 0 0 0-3-3"/><path d="M12 12a3 3 0 0 0-3 3"/><path d="m4.9 19.1 1.2-1.2"/><path d="M15 13H3"/><path d="M18 6 7 17"/></Icon>
);

export const MessagesSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></Icon>
);

export const FeatherIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" x2="2" y1="8" y2="22"/><line x1="17.5" x2="9" y1="15" y2="15"/></Icon>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>
);

export const SitemapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 11h4a2 2 0 0 0 2-2V7"/><path d="M11 15h4"/><path d="M13 17v-4"/><path d="M7 15h2"/></Icon>
);

export const HeadphonesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></Icon>
);

export const PanelLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></Icon>
);

export const FilePenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/></Icon>
);

export const BarChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></Icon>
);

export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="10.5" cy="17.5" r=".5" fill="currentColor"/><path d="M7 19a2 2 0 0 0 1.41-3.41L10 14l-2.5-2.5-4-4-.58-.58A2 2 0 0 0 2 8.42l5 5Z"/><path d="M19 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3Z"/></Icon>
);

export const ContactIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></Icon>
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M5 12h14"/><path d="M12 5v14"/></Icon>
);

export const Trash2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></Icon>
);

export const Loader2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></Icon>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></Icon>
);
export const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></Icon>
);

export const LayersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></Icon>
);

export const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a2 2 0 0 1-.553 1.106l-4.553 4.553a2 2 0 0 1-1.788 0l-3.659-1.83a2 2 0 0 0-1.788 0l-3.659 1.83a1 1 0 0 1-1.447-.894V8.382a2 2 0 0 1 .553-1.106L8.66 2.724a2 2 0 0 1 1.788 0l3.659 1.83Z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></Icon>
);

export const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></Icon>
);

export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></Icon>
);

export const FlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></Icon>
);

export const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>
);

export const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></Icon>
);
export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>
);

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></Icon>
);

export const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></Icon>
);
export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></Icon>
);

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></Icon>
);

export const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Icon>
);

export const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>
);

export const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></Icon>
);

export const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></Icon>
);

export const CloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></Icon>
);

export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>
);

export const RefreshCwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></Icon>
);

export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></Icon>
);

export const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></Icon>
);

export const DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></Icon>
);

export const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></Icon>
);

export const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></Icon>
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></Icon>
);

export const UnlockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></Icon>
);

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>
);

export const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Icon>
);

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></Icon>
);

export const MicOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></Icon>
);

export const HelpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Icon>
);
