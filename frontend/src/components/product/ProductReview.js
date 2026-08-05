import { useMemo, useState } from 'react';
import GalleryLightbox from './GalleryLightbox';
import { getReviewImages, getHelpfulBase } from '../../utils/productHelper';

const HELP_KEY = 'vijaycart_review_helpful';

const avatarInitial = (name) => {
    const raw = (name || 'U').trim();
    return raw ? raw[0].toUpperCase() : 'U';
};

const reviewerName = (review) => review.userName || review.user?.name || 'Anonymous';

function ReviewCard({ review }) {
    const [helpful, setHelpful] = useState(() => {
        try {
            return !!JSON.parse(localStorage.getItem(HELP_KEY) || '{}')[review._id || review.comment];
        } catch {
            return false;
        }
    });
    const [lightbox, setLightbox] = useState(null);

    const images = useMemo(() => getReviewImages(review), [review]);
    const shown = images.slice(0, 4);
    const more = images.length - shown.length;
    const helpfulCount = getHelpfulBase(review) + (helpful ? 1 : 0);

    const toggleHelpful = () => {
        setHelpful(prev => {
            const next = !prev;
            try {
                const raw = JSON.parse(localStorage.getItem(HELP_KEY) || '{}');
                raw[review._id || review.comment] = next;
                localStorage.setItem(HELP_KEY, JSON.stringify(raw));
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    const openGallery = (index) => {
        if (images.length) setLightbox({ index });
    };

    return (
        <div className="review-card">
            <div className="review-avatar">{avatarInitial(reviewerName(review))}</div>
            <div className="review-body">
                <div className="review-top">
                    <span className="review-name">{reviewerName(review)}</span>
                    <span className="review-verified"><i className="fa fa-check-circle" aria-hidden="true"></i> Verified Purchase</span>
                </div>
                <div className="review-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                        <i
                            key={s}
                            className={`fa fa-star ${s <= Number(review.rating) ? 'on' : ''}`}
                            aria-hidden="true"
                        ></i>
                    ))}
                    <span className="review-stars-num">{Number(review.rating)}</span>
                </div>
                <p className="review-comment">{review.comment}</p>

                {images.length > 0 && (
                    <div className="review-images">
                        {shown.map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="review-img"
                                onClick={() => openGallery(idx)}
                                aria-label="View review photo"
                            >
                                <img src={img} alt="Customer review" loading="lazy" />
                            </button>
                        ))}
                        {more > 0 && (
                            <button type="button" className="review-img-more" onClick={() => openGallery(4)}>
                                +{more} More
                            </button>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    className={`helpful-btn ${helpful ? 'active' : ''}`}
                    onClick={toggleHelpful}
                    aria-pressed={helpful}
                >
                    <i className="fa fa-thumbs-o-up" aria-hidden="true"></i>
                    {helpful ? 'Helpful' : 'Mark as helpful'}
                    <span className="helpful-count">({helpfulCount})</span>
                </button>
            </div>

            {lightbox && (
                <GalleryLightbox
                    images={images}
                    startIndex={lightbox.index}
                    title="Review photos"
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
}

export default function ProductReview({ reviews }) {
    if (!reviews || reviews.length === 0) return null;

    return (
        <div className="review-list" style={{ animation: 'fadeInUp 0.5s ease' }}>
            {reviews.map(review => (
                <ReviewCard key={review._id || review.comment} review={review} />
            ))}
        </div>
    );
}
