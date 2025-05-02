from flask import Flask
from flask_cors import CORS
from app.routes.routes import routes  # Import the Blueprint
from app.modules.send_to_caldera import start_caldera_thread, terminate_caldera

app = Flask(__name__)
CORS(app)

# Register the Blueprint
app.register_blueprint(routes)

# Variable to track if the first request has been handled
has_started_caldera = False

@app.before_request
def start_caldera_on_first_request():
    global has_started_caldera
    if not has_started_caldera:
        try:
            start_caldera_thread()
            has_started_caldera = True
        except Exception as e:
            app.logger.error(f"Failed to start Caldera thread: {e}")

if __name__ == "__main__":
    try:
        app.run(debug=True)
    except KeyboardInterrupt:
        app.logger.info("Application interrupted. Cleaning up...")
        terminate_caldera()
