import './SkeletonMusicCard.css';

export default function SkeletonMusicCard() {
  return (
    <div className="skeletonMusicCard">
      <div className="skeletonMusicCardTop">
        {/* Image skeleton */}
        <div className="skeletonMusicCardImageContainer">
          <div className="skeletonMusicCardImage"></div>
        </div>

        {/* Info skeleton */}
        <div className="skeletonMusicCardInfo">
          <div className="skeletonMusicCardTitle"></div>
          <div className="skeletonMusicCardDescription"></div>
          <div className="skeletonMusicCardDescriptionShort"></div>
          <div className="skeletonMusicCardButton"></div>
        </div>

        {/* Purchase skeleton */}
        <div className="skeletonMusicCardPurchase">
          <div className="skeletonMusicCardPrice"></div>
          <div className="skeletonMusicCardPurchaseButton"></div>
        </div>
      </div>

      {/* Player skeleton */}
      <div className="skeletonMusicCardPlayer">
        <div className="skeletonMusicCardPlayButton"></div>
        <div className="skeletonMusicCardProgressBar"></div>
      </div>
    </div>
  );
}








