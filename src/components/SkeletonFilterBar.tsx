import './SkeletonFilterBar.css';

export default function SkeletonFilterBar() {
  return (
    <div className="skeletonFilterBar">
      <div className="skeletonFilterBarContent">
        {/* Genre Filter Skeleton */}
        <div className="skeletonFilterGroup">
          <div className="skeletonFilterLabel"></div>
          <div className="skeletonFilterSelect"></div>
        </div>

        {/* Price Filter Skeleton */}
        <div className="skeletonFilterGroup">
          <div className="skeletonFilterLabel"></div>
          <div className="skeletonFilterSelect"></div>
        </div>

        {/* Date Sort Skeleton */}
        <div className="skeletonFilterGroup">
          <div className="skeletonFilterLabel"></div>
          <div className="skeletonFilterSelect"></div>
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="skeletonFilterSearchContainer">
        <div className="skeletonFilterSearchInput"></div>
      </div>
    </div>
  );
}
