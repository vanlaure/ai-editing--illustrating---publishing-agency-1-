import React, { useState } from 'react';
import type { Bibles } from '../types';
import Spinner from './Spinner';

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.393.73a5.002 5.002 0 00-8.61-1.735.999.999 0 01-1.724-.998A7.002 7.002 0 014 4.101V6a1 1 0 01-2 0V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.393-.73a5.002 5.002 0 008.61 1.735.999.999 0 011.724.998A7.002 7.002 0 0116 15.899V14a1 1 0 012 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);

const BibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h6 className="font-semibold text-gray-300 mb-2">{title}</h6>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: string | string[] | undefined }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-white">{displayValue}</p>
        </div>
    );
};

const ColorSwatches: React.FC<{ colors: string[] | undefined, label: string }> = ({ colors, label }) => {
  if (!colors || colors.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
            <div className="flex items-center space-x-2 mt-1">
                {colors.map(color => (
                    <div key={color} title={color} className="w-6 h-6 rounded-full border-2 border-brand-dark shadow-md overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <rect x="0" y="0" width="100" height="100" rx="50" fill={color} />
                        </svg>
                    </div>
                ))}
            </div>
    </div>
  );
};

const ImageCarousel: React.FC<{ images: string[], alt: string, className?: string, onRegenerate?: () => void }> = ({ images, alt, className, onRegenerate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-brand-dark text-gray-500 text-sm h-full w-full ${className}`}>
                <div className="flex flex-col items-center">
                    <Spinner />
                    <p className="text-xs text-gray-400 mt-2">Generating Image...</p>
                </div>
            </div>
        );
    }
    
    if (images[0] === 'error') {
        return (
            <div className={`flex flex-col items-center justify-center bg-red-900/50 text-red-300 text-sm h-full w-full p-4 text-center ${className}`}>
                <p>Image generation failed.</p>
                {onRegenerate && (
                    <button onClick={onRegenerate} className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md text-xs font-semibold hover:bg-red-600">
                        Try Again
                    </button>
                )}
            </div>
        );
    }

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
    <div className={`relative group h-full w-full ${className}`}>
        <img
            src={images[currentIndex]}
            alt={`${alt} (${currentIndex + 1} of ${images.length})`}
            className="w-full h-full object-cover"
        />
        {onRegenerate && (
            <button
                onClick={onRegenerate}
                aria-label="Regenerate image"
                title="Regenerate image"
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-magenta transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <RegenerateIcon />
            </button>
        )}
        {images.length > 1 && (
        <>
            <button onClick={goToPrevious} aria-label="Previous image" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-magenta transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={goToNext} aria-label="Next image" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-brand-magenta transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 bg-black/40 px-2 py-1 rounded-full">
            {images.map((_, index) => (
                <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`} aria-label={`Go to image ${index + 1}`}></button>
            ))}
            </div>
        </>
        )}
    </div>
    );
};


interface BiblesDisplayProps {
    bibles: Bibles | null;
    onRegenerateBibleImage?: (item: { type: 'character' | 'location'; name: string }) => void;
}

const BiblesDisplay: React.FC<BiblesDisplayProps> = ({ bibles, onRegenerateBibleImage }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!bibles) return null;
    
    const characters = bibles.characters || [];
    const locations = bibles.locations || [];

    return (
        <details open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)} className="w-full bg-brand-dark/50 rounded-lg border border-brand-light-gray mb-8 overflow-hidden">
            <summary className="p-4 flex justify-between items-center cursor-pointer hover:bg-brand-light-gray/50 transition-colors">
                <h3 className="text-xl font-semibold text-white">Visual Bibles</h3>
                <svg className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </summary>
            <div className="p-6 border-t border-brand-light-gray/50">
                {characters.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-brand-cyan mb-4">Characters</h4>
                        <div className="space-y-4">
                            {characters.map(char => (
                                <div key={char.name} className="bg-brand-light-gray rounded-lg overflow-hidden flex flex-col md:flex-row">
                                    <div className="md:w-1/3 flex-shrink-0 h-80 md:h-auto">
                                        <ImageCarousel 
                                            images={char.source_images} 
                                            alt={`Image of ${char.name}`} 
                                            onRegenerate={onRegenerateBibleImage ? () => onRegenerateBibleImage({ type: 'character', name: char.name }) : undefined}
                                        />
                                    </div>
                                    <div className="p-4 flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-bold text-lg text-white mb-1">{char.name}</h5>
                                            <p className="text-sm text-gray-400 italic mb-4">{char.role_in_story}</p>
                                            
                                            <BibleSection title="Physical Appearance">
                                                <DetailItem label="Age & Gender" value={`${char.physical_appearance.age_range}, ${char.physical_appearance.gender_presentation}`} />
                                                <DetailItem label="Ethnicity & Body Type" value={`${char.physical_appearance.ethnicity}, ${char.physical_appearance.body_type}`} />
                                                <DetailItem label="Key Features" value={char.physical_appearance.key_facial_features} />
                                                <DetailItem label="Hair & Eyes" value={`${char.physical_appearance.hair_style_and_color}, ${char.physical_appearance.eye_color} eyes`} />
                                            </BibleSection>

                                            <BibleSection title="Costuming & Props">
                                                <DetailItem label="Outfit Style" value={char.costuming_and_props.outfit_style} />
                                                <DetailItem label="Specific Items" value={char.costuming_and_props.specific_clothing_items} />
                                                <DetailItem label="Signature Props" value={char.costuming_and_props.signature_props} />
                                            </BibleSection>
                                        </div>
                                        <div className="border-t border-brand-dark md:border-t-0 md:border-l md:pl-4">
                                            <BibleSection title="Performance & Demeanor">
                                                <DetailItem label="Emotional Arc" value={char.performance_and_demeanor.emotional_arc} />
                                                <DetailItem label="Performance Style" value={char.performance_and_demeanor.performance_style} />
                                                <DetailItem label="Gaze" value={char.performance_and_demeanor.gaze_direction} />
                                            </BibleSection>

                                            <BibleSection title="Cinematic Style">
                                                <DetailItem label="Camera Lenses" value={char.cinematic_style.camera_lenses} />
                                                <DetailItem label="Lighting Style" value={char.cinematic_style.lighting_style} />
                                                <ColorSwatches colors={char.cinematic_style.color_dominants_in_shots} label="Color Dominants" />
                                            </BibleSection>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {locations.length > 0 && (
                     <div>
                        <h4 className="text-lg font-bold text-brand-cyan mb-4">Locations</h4>
                        <div className="space-y-4">
                            {locations.map(loc => (
                                <div key={loc.name} className="bg-brand-light-gray rounded-lg overflow-hidden flex flex-col md:flex-row">
                                    <div className="md:w-1/3 flex-shrink-0 h-64 md:h-auto">
                                        <ImageCarousel 
                                            images={loc.source_images} 
                                            alt={`Image of ${loc.name}`} 
                                            onRegenerate={onRegenerateBibleImage ? () => onRegenerateBibleImage({ type: 'location', name: loc.name }) : undefined}
                                        />
                                    </div>
                                    <div className="p-4 flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-bold text-lg text-white mb-1">{loc.name}</h5>
                                            <p className="text-sm text-gray-400 italic mb-4">{loc.setting_type}</p>

                                            <BibleSection title="Atmosphere & Environment">
                                                <DetailItem label="Dominant Mood" value={loc.atmosphere_and_environment.dominant_mood} />
                                                <DetailItem label="Time of Day" value={loc.atmosphere_and_environment.time_of_day} />
                                                <DetailItem label="Weather" value={loc.atmosphere_and_environment.weather} />
                                            </BibleSection>
                                             <BibleSection title="Sensory Details">
                                                <DetailItem label="Textures" value={loc.sensory_details.textures} />
                                                <DetailItem label="Environmental Effects" value={loc.sensory_details.environmental_effects} />
                                            </BibleSection>
                                        </div>
                                        <div className="border-t border-brand-dark md:border-t-0 md:border-l md:pl-4">
                                            <BibleSection title="Architectural & Natural Details">
                                                <DetailItem label="Style" value={loc.architectural_and_natural_details.style} />
                                                <DetailItem label="Key Features" value={loc.architectural_and_natural_details.key_features} />
                                            </BibleSection>

                                            <BibleSection title="Cinematic Style">
                                                <DetailItem label="Lighting Style" value={loc.cinematic_style.lighting_style} />
                                                <DetailItem label="Camera Perspective" value={loc.cinematic_style.camera_perspective} />
                                                <ColorSwatches colors={loc.cinematic_style.color_palette} label="Color Palette" />
                                            </BibleSection>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </details>
    );
};

export default BiblesDisplay;