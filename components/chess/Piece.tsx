import { getPieceIconPath } from "@/utils/chessUtils";
import { motion } from "framer-motion";

interface PieceProps {
  type: string;
  color: string;
  className?: string;
  isDraggable?: boolean;
}

const Piece: React.FC<PieceProps> = ({ type, color, className = "" }) => {
  const iconPath = getPieceIconPath(type, color);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
    >
      <img
        src={iconPath}
        alt={`${color === "w" ? "White" : "Black"} ${type}`}
        className="w-full h-full drop-shadow-md select-none"
        draggable={false}
      />
    </motion.div>
  );
};

export default Piece;
